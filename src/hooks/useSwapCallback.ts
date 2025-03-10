import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { TransactionResponse } from '@ethersproject/providers';
import {
  JSBI,
  Percent,
  Router,
  SwapParameters,
  Trade,
  TradeType,
} from '@uniswap/sdk';
import { useMemo } from 'react';
import { GlobalConst } from 'constants/index';
import { useTransactionAdder } from 'state/transactions/hooks';
import {
  calculateGasMargin,
  isZero,
  isAddress,
  shortenAddress,
  formatTokenAmount,
} from 'utils';
import { useActiveWeb3React } from 'hooks';
import { useRouterContract } from './useContract';
import useTransactionDeadline from './useTransactionDeadline';
import useENS from './useENS';
import { Version } from './useToggledVersion';
import { TransactionType } from 'models/enums';

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface SwapCall {
  contract: Contract;
  parameters: SwapParameters;
}

interface SuccessfulCall {
  call: SwapCall;
  gasEstimate: BigNumber;
}

interface FailedCall {
  call: SwapCall;
  error: Error;
}

type EstimatedSwapCall = SuccessfulCall | FailedCall;

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
export function useSwapCallArguments(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = GlobalConst.utils.INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender,
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React();

  const { address: recipientAddress } = useENS(recipientAddressOrName);
  const recipient =
    recipientAddressOrName === null ? account : recipientAddress;
  const deadline = useTransactionDeadline();
  const contract = useRouterContract();

  return useMemo(() => {
    const tradeVersion = Version.v2;
    if (
      !trade ||
      !recipient ||
      !library ||
      !account ||
      !tradeVersion ||
      !chainId
    )
      return [];

    if (!contract) {
      return [];
    }

    const swapMethods: any[] = [];

    switch (tradeVersion) {
      case Version.v2:
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage: new Percent(
              JSBI.BigInt(allowedSlippage),
              GlobalConst.utils.BIPS_BASE,
            ),
            recipient,
            ttl: deadline
              ? deadline.toNumber()
              : GlobalConst.utils.DEFAULT_DEADLINE_FROM_NOW,
          }),
        );

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          swapMethods.push(
            Router.swapCallParameters(trade, {
              feeOnTransfer: true,
              allowedSlippage: new Percent(
                JSBI.BigInt(allowedSlippage),
                GlobalConst.utils.BIPS_BASE,
              ),
              recipient,
              ttl: deadline
                ? deadline.toNumber()
                : GlobalConst.utils.DEFAULT_DEADLINE_FROM_NOW,
            }),
          );
        }
        break;
    }
    return swapMethods.map((parameters) => ({ parameters, contract }));
  }, [
    account,
    allowedSlippage,
    chainId,
    deadline,
    library,
    recipient,
    trade,
    contract,
  ]);
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = GlobalConst.utils.INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): {
  state: SwapCallbackState;
  callback:
    | null
    | (() => Promise<{ response: TransactionResponse; summary: string }>);
  error: string | null;
} {
  const { account, chainId, library } = useActiveWeb3React();

  const swapCalls = useSwapCallArguments(
    trade,
    allowedSlippage,
    recipientAddressOrName,
  );

  const addTransaction = useTransactionAdder();

  const { address: recipientAddress } = useENS(recipientAddressOrName);
  const recipient =
    recipientAddressOrName === null ? account : recipientAddress;

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return {
        state: SwapCallbackState.INVALID,
        callback: null,
        error: 'Missing dependencies',
      };
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return {
          state: SwapCallbackState.INVALID,
          callback: null,
          error: 'Invalid recipient',
        };
      } else {
        return {
          state: SwapCallbackState.LOADING,
          callback: null,
          error: null,
        };
      }
    }

    const tradeVersion = Version.v2;

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<{
        response: TransactionResponse;
        summary: string;
      }> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map((call) => {
            const {
              parameters: { methodName, args, value },
              contract,
            } = call;
            const options = !value || isZero(value) ? {} : { value };

            return contract.estimateGas[methodName](...args, options)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate: gasEstimate.add(100000),
                };
              })
              .catch((gasError) => {
                console.debug(
                  'Gas estimate failed, trying eth_call to extract error',
                  call,
                );

                return contract.callStatic[methodName](...args, options)
                  .then((result) => {
                    console.debug(
                      'Unexpected successful call after failed estimate gas',
                      call,
                      gasError,
                      result,
                    );
                    return {
                      call,
                      error: new Error(
                        'Unexpected issue with estimating the gas. Please try again.',
                      ),
                    };
                  })
                  .catch((callError) => {
                    console.debug('Call threw error', call, callError);
                    let errorMessage: string;
                    switch (callError.reason) {
                      case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.';
                        break;
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`;
                    }
                    return { call, error: new Error(errorMessage) };
                  });
              });
          }),
        );

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        const successfulEstimation = estimatedCalls.find(
          (el): el is SuccessfulCall => 'gasEstimate' in el,
        );

        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter(
            (call): call is FailedCall => 'error' in call,
          );
          if (errorCalls.length > 0)
            throw errorCalls[errorCalls.length - 1].error;
          throw new Error(
            'Unexpected error. Please contact support: none of the calls threw an error',
          );
        }

        const {
          call: {
            contract,
            parameters: { methodName, args, value },
          },
          gasEstimate,
        } = successfulEstimation;

        return contract[methodName](...args, {
          gasLimit: calculateGasMargin(gasEstimate),
          ...(value && !isZero(value)
            ? { value, from: account }
            : { from: account }),
        })
          .then((response: TransactionResponse) => {
            const inputSymbol = trade.inputAmount.currency.symbol;
            const outputSymbol = trade.outputAmount.currency.symbol;
            const inputAmount = formatTokenAmount(trade.inputAmount);
            const outputAmount = formatTokenAmount(trade.outputAmount);

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`;
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`;

            const withVersion =
              tradeVersion === Version.v2
                ? withRecipient
                : `${withRecipient} on ${(tradeVersion as any).toUpperCase()}`;

            addTransaction(response, {
              summary: withVersion,
              type: TransactionType.SWAPPED,
            });

            return { response, summary: withVersion };
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 'ACTION_REJECTED') {
              throw new Error('Transaction rejected.');
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, methodName, args, value);
              throw new Error(`Swap failed: ${error.message}`);
            }
          });
      },
      error: null,
    };
  }, [
    trade,
    library,
    account,
    chainId,
    recipient,
    recipientAddressOrName,
    swapCalls,
    addTransaction,
  ]);
}
