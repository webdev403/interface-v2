import React, { useState, useMemo } from 'react';
import { Box } from '@material-ui/core';
import { TopMovers, TokensTable } from 'components';
import { useBookmarkTokens } from 'state/application/hooks';
import { Skeleton } from '@material-ui/lab';
import { useTranslation } from 'react-i18next';
import { useActiveWeb3React, useAnalyticsVersion } from 'hooks';
import { useAnalyticsTopTokens } from 'hooks/useFetchAnalyticsData';
import { GlobalData } from 'constants/index';

const AnalyticsTokens: React.FC = () => {
  const { t } = useTranslation();
  const [tokensFilter, setTokensFilter] = useState(0);

  const { bookmarkTokens } = useBookmarkTokens();
  const { chainId } = useActiveWeb3React();
  const version = useAnalyticsVersion();
  const excludedInTrending = [
    'ETH',
    'WBTC',
    'POL',
    'USDT',
    'USDC',
    'USDC.E',
    'MATIC',
    'WETH',
  ];
  const {
    isLoading: topTokensLoading,
    data: topTokens,
  } = useAnalyticsTopTokens(version, chainId);

  const checkIfStable = (token) => {
    let result = true;
    Object.entries(GlobalData.stableCoins).forEach(([key, values]) => {
      values.forEach((value) => {
        result =
          token.symbol !== value.symbol &&
          excludedInTrending.findIndex(
            (item) => item.toLowerCase() === token.symbol.toLowerCase(),
          ) === -1;
      });
    });
    return result;
  };
  const favoriteTokens = useMemo(() => {
    if (topTokens) {
      return topTokens.filter(
        (token: any) => bookmarkTokens.indexOf(token.id) > -1,
      );
    } else {
      return [];
    }
  }, [topTokens, bookmarkTokens]);

  const trendingTokens = useMemo(() => {
    if (topTokens) {
      const trendingTokens = [...topTokens].sort(
        (a, b) => b.oneDayVolumeUSD - a.oneDayVolumeUSD,
      );
      return trendingTokens
        .filter((token: any) => {
          return checkIfStable(token);
        })
        .slice(0, 10);
    }
  }, [topTokens]);

  return (
    <Box width='100%' mb={3}>
      <TopMovers hideArrow={true} />
      <Box my={4} px={2} className='flex flex-wrap items-center'>
        <Box
          className={`tokensFilter ${
            tokensFilter === 0 ? 'text-primary' : 'text-disabled'
          }`}
          onClick={() => setTokensFilter(0)}
        >
          <p className='weight-600'>{t('allCryptos')}</p>
        </Box>
        <Box
          className={`tokensFilter ${
            tokensFilter === 1 ? 'text-primary' : 'text-disabled'
          }`}
          onClick={() => setTokensFilter(1)}
        >
          <p className='weight-600'>{t('favourites')}</p>
        </Box>
        <Box
          className={`tokensFilter ${
            tokensFilter === 2 ? 'text-primary' : 'text-disabled'
          }`}
          onClick={() => setTokensFilter(2)}
        >
          <p className='weight-600'>{t('trending')}</p>
        </Box>
      </Box>
      <Box className='panel'>
        {topTokensLoading ? (
          <Skeleton variant='rect' width='100%' height={150} />
        ) : topTokens ? (
          <TokensTable
            data={
              tokensFilter === 0
                ? topTokens
                : tokensFilter === 1
                ? favoriteTokens
                : trendingTokens
            }
          />
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsTokens;
