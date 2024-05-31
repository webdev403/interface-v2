import { Currency, Fraction, Percent } from '@uniswap/sdk';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useUserSlippageTolerance } from 'state/user/hooks';
import { computePriceImpact } from 'utils/prices';
import {
  QuestionHelper,
  FormattedPriceImpact,
  CurrencyLogo,
  SettingsModal,
} from 'components';
import EditIcon from 'svgs/EditIcon.svg';
import { basisPointsToPercent } from 'utils';
import { OptimalRate, SwapSide } from '@paraswap/sdk';
import { ONE } from 'v3lib/utils';
import styles from 'styles/components/Swap.module.scss';
import { useAutoSlippageToleranceBestTrade } from 'hooks/useAutoSlippageTolerance';
import { SLIPPAGE_AUTO } from 'state/user/reducer';

interface TradeSummaryProps {
  optimalRate: OptimalRate;
  allowedSlippage: Percent;
  inputCurrency: Currency;
  outputCurrency: Currency;
}

export const BestTradeSummary: React.FC<TradeSummaryProps> = ({
  optimalRate,
  allowedSlippage,
  inputCurrency,
  outputCurrency,
}) => {
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const { t } = useTranslation();
  const [userSlippage] = useUserSlippageTolerance();

  const priceImpactWithoutFee = computePriceImpact(optimalRate);
  const isExactIn = optimalRate.side === SwapSide.SELL;
  const currency = isExactIn ? outputCurrency : inputCurrency;
  const autoSlippage = useAutoSlippageToleranceBestTrade(optimalRate);
  const tradeAmount = isExactIn
    ? new Fraction(ONE)
        .add(userSlippage === SLIPPAGE_AUTO ? autoSlippage : allowedSlippage)
        .invert()
        .multiply(optimalRate.destAmount).quotient
    : new Fraction(ONE)
        .add(userSlippage === SLIPPAGE_AUTO ? autoSlippage : allowedSlippage)
        .multiply(optimalRate.srcAmount).quotient;

  return (
    <Box mt={1.5}>
      {openSettingsModal && (
        <SettingsModal
          open={openSettingsModal}
          onClose={() => setOpenSettingsModal(false)}
        />
      )}
      <Box className={styles.summaryRow}>
        <Box>
          <small>{t('maxSlippage')}:</small>
          <QuestionHelper text={t('slippageHelper')} />
        </Box>
        <Box
          onClick={() => setOpenSettingsModal(true)}
          className={styles.swapSlippage}
        >
          <small>
            {userSlippage === SLIPPAGE_AUTO
              ? Number(autoSlippage.toSignificant())
              : Number(allowedSlippage.toSignificant())}
            %
          </small>
          <EditIcon />
        </Box>
      </Box>
      <Box className={styles.summaryRow}>
        <Box>
          <small>{isExactIn ? t('minReceived') : t('maxSold')}:</small>
          <QuestionHelper text={t('txLimitHelper')} />
        </Box>
        <Box>
          <small>
            {(
              Number(tradeAmount.toString()) /
              10 ** currency.decimals
            ).toLocaleString('us')}{' '}
            {currency.symbol}
          </small>
          <CurrencyLogo currency={currency} size={16} />
        </Box>
      </Box>
      <Box className={styles.summaryRow}>
        <Box>
          <small>{t('priceimpact')}:</small>
          <QuestionHelper text={t('priceImpactHelper')} />
        </Box>
        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
      </Box>
    </Box>
  );
};

export interface BestTradeAdvancedSwapDetailsProps {
  optimalRate?: OptimalRate | null;
  inputCurrency?: Currency;
  outputCurrency?: Currency;
}

export const BestTradeAdvancedSwapDetails: React.FC<BestTradeAdvancedSwapDetailsProps> = ({
  optimalRate,
  inputCurrency,
  outputCurrency,
}) => {
  const [allowedSlippage] = useUserSlippageTolerance();
  const pct = basisPointsToPercent(allowedSlippage);

  return (
    <>
      {inputCurrency && outputCurrency && optimalRate && (
        <BestTradeSummary
          optimalRate={optimalRate}
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          allowedSlippage={pct}
        />
      )}
    </>
  );
};
