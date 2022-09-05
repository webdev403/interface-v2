import React, { useEffect, useMemo, useState } from 'react';
import { PoolState, usePool } from 'hooks/v3/usePools';
import { useToken } from 'hooks/v3/Tokens';
import { Price, Token, Percent } from '@uniswap/sdk-core';
import Loader from 'components/Loader';
import { unwrappedToken } from 'utils/unwrappedToken';
import { Bound, setShowNewestPosition } from 'state/mint/v3/actions';
import { ArrowRight } from 'react-feather';
import usePrevious from 'hooks/usePrevious';
import { PositionPool } from 'models/interfaces';
import { NavLink } from 'react-router-dom';
import RangeBadge from 'components/v3/Badge/RangeBadge';
import { useAppDispatch } from 'state/hooks';
import './index.scss';
import useIsTickAtLimit from 'hooks/v3/useIsTickAtLimit';
import { formatTickPrice } from 'utils/v3/formatTickPrice';
import DoubleCurrencyLogo from 'components/DoubleCurrencyLogo';
import { Position } from 'v3lib/entities/position';
import { WMATIC_EXTENDED } from 'constants/v3/addresses';
import { GlobalValue } from 'constants/index';
import { toToken } from 'constants/v3/routing';
import { Box } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import Badge, { BadgeVariant } from 'components/v3/Badge';
import PositionListItemDetails from '../PositionListItemDetails';

interface PositionListItemProps {
  positionDetails: PositionPool;
  newestPosition?: number | undefined;
  highlightNewest?: boolean;
  hideExpand?: boolean;
}

export function getPriceOrderingFromPositionForUI(
  position?: Position,
): {
  priceLower?: Price<Token, Token>;
  priceUpper?: Price<Token, Token>;
  quote?: Token;
  base?: Token;
} {
  if (!position) {
    return {};
  }

  const token0 = position.amount0.currency;
  const token1 = position.amount1.currency;

  const USDC = toToken(GlobalValue.tokens.COMMON.USDC);
  const USDT = toToken(GlobalValue.tokens.COMMON.USDT);

  // if token0 is a dollar-stable asset, set it as the quote token
  // const stables = [USDC_BINANCE, USDC_KOVAN]
  const stables = [USDC, USDT];
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    };
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  //TODO
  // const bases = [...Object.values(WMATIC_EXTENDED), WBTC]
  const bases = [...Object.values(WMATIC_EXTENDED)];
  if (bases.some((base) => base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    };
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    };
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  };
}

export default function PositionListItem({
  positionDetails,
  newestPosition,
  highlightNewest,
  hideExpand = false,
}: PositionListItemProps) {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(hideExpand);

  const prevPositionDetails = usePrevious({ ...positionDetails });
  const {
    token0: _token0Address,
    token1: _token1Address,
    liquidity: _liquidity,
    tickLower: _tickLower,
    tickUpper: _tickUpper,
    onFarming: _onFarming,
    oldFarming: _oldFarming,
  } = useMemo(() => {
    if (
      !positionDetails &&
      prevPositionDetails &&
      prevPositionDetails.liquidity
    ) {
      return { ...prevPositionDetails };
    }
    return { ...positionDetails };
  }, [positionDetails]);

  const token0 = useToken(_token0Address);
  const token1 = useToken(_token1Address);

  const currency0 = token0 ? unwrappedToken(token0) : undefined;
  const currency1 = token1 ? unwrappedToken(token1) : undefined;

  // construct Position from details returned
  const [poolState, pool] = usePool(
    currency0 ?? undefined,
    currency1 ?? undefined,
  );
  const [prevPoolState, prevPool] = usePrevious([poolState, pool]) || [];
  const [_poolState, _pool] = useMemo(() => {
    if (!pool && prevPool && prevPoolState) {
      return [prevPoolState, prevPool];
    }
    return [poolState, pool];
  }, [pool, poolState]);

  const position = useMemo(() => {
    if (_pool) {
      return new Position({
        pool: _pool,
        liquidity: _liquidity.toString(),
        tickLower: _tickLower,
        tickUpper: _tickUpper,
      });
    }
    return undefined;
  }, [_liquidity, _pool, _tickLower, _tickUpper]);

  const tickAtLimit = useIsTickAtLimit(_tickLower, _tickUpper);

  // prices
  const {
    priceLower,
    priceUpper,
    quote,
    base,
  } = getPriceOrderingFromPositionForUI(position);
  const currencyQuote = quote && unwrappedToken(quote);
  const currencyBase = base && unwrappedToken(base);

  // check if price is within range
  const outOfRange: boolean = _pool
    ? _pool.tickCurrent < _tickLower || _pool.tickCurrent >= _tickUpper
    : false;

  const farmingLink = `/farm/v3`;

  const isNewest = newestPosition
    ? newestPosition === +positionDetails.tokenId
    : undefined;

  const removed = _liquidity?.eq(0);

  useEffect(() => {
    if (newestPosition && highlightNewest) {
      dispatch(setShowNewestPosition({ showNewestPosition: false }));
      document.querySelector('#newest')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <Box className='v3-pool-liquidity-item'>
      <Box className='flex items-center'>
        <Box className='flex' mr={1}>
          <DoubleCurrencyLogo
            currency0={currencyQuote}
            currency1={currencyBase}
            size={24}
          />
        </Box>
        <p>
          {currencyQuote?.symbol}-{currencyBase?.symbol}
        </p>
        {_onFarming ? (
          <Box
            className='flex items-center bg-primary cursor-pointer'
            padding='0 5px'
            height='24px'
            borderRadius='4px'
            ml={1}
            onClick={() => history.push(farmingLink)}
            color='white'
          >
            <p className='caption'>Farming</p>
            <Box className='flex' ml='5px'>
              <ArrowRight size={14} />
            </Box>
          </Box>
        ) : _oldFarming ? (
          <Box ml={1}>
            <Badge
              variant={BadgeVariant.WARNING}
              text='On Old Farming Center'
            />
          </Box>
        ) : (
          <div />
        )}
        <Box ml={1}>
          <RangeBadge removed={removed} inRange={!outOfRange} />
        </Box>
        <Box ml={1}>
          <Badge
            text={`${new Percent(
              positionDetails.fee || 100,
              1_000_000,
            ).toSignificant()}
                        %`}
          ></Badge>
        </Box>
      </Box>

      {!expanded && (
        <Box width={1} mt={1}>
          {_poolState === PoolState.LOADING && (
            <Box width={1} className='flex justify-center'>
              <Loader size={'1rem'} stroke={'var(--white)'} />
            </Box>
          )}
          {_poolState !== PoolState.LOADING && priceLower && priceUpper && (
            <span className='text-secondary'>
              Min{' '}
              {`${formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)} ${
                currencyQuote?.symbol
              } per ${currencyBase?.symbol}`}
              {' <'}-{'> '}Max{' '}
              {`${formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)} ${
                currencyQuote?.symbol
              } per ${currencyBase?.symbol}`}
            </span>
          )}
        </Box>
      )}

      {_poolState !== PoolState.LOADING && !hideExpand && (
        <Box
          className='v3-pool-liquidity-item-expand'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </Box>
      )}

      {expanded && (
        <Box mt={3}>
          <PositionListItemDetails positionDetails={positionDetails} />
        </Box>
      )}
    </Box>
  );
}