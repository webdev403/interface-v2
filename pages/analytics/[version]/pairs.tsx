import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { PairTable } from 'components';
import {
  getTopPairs,
  getBulkPairData,
  getGammaRewards,
  getGammaData,
} from 'utils';
import { Skeleton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { GammaPairs, GlobalConst } from 'constants/index';
import { useEthPrice } from 'state/application/hooks';
import { getTopPairsV3, getPairsAPR, getTopPairsTotal } from 'utils/v3-graph';
import { useDispatch } from 'react-redux';
import { setAnalyticsLoaded } from 'state/analytics/actions';
import { useRouter } from 'next/router';
import { useActiveWeb3React } from 'hooks';

const AnalyticsPairs: React.FC = () => {
  const { t } = useTranslation();
  const { chainId } = useActiveWeb3React();
  const [topPairs, updateTopPairs] = useState<any[] | null>(null);
  const { ethPrice } = useEthPrice();

  const dispatch = useDispatch();

  const router = useRouter();
  const version = router.query.version ?? 'total';

  useEffect(() => {
    (async () => {
      if (version === 'v3') {
        const pairsData = await getTopPairsV3(
          GlobalConst.utils.ANALYTICS_PAIRS_COUNT,
        );
        if (pairsData) {
          const data = pairsData.filter((item: any) => !!item);
          try {
            const aprs = await getPairsAPR(data.map((item: any) => item.id));
            const gammaRewards = await getGammaRewards(chainId);
            const gammaData = await getGammaData();

            updateTopPairs(
              data.map((item: any, ind: number) => {
                const gammaPairs =
                  GammaPairs[
                    item.token0.id.toLowerCase() +
                      '-' +
                      item.token1.id.toLowerCase()
                  ] ??
                  GammaPairs[
                    item.token1.id.toLowerCase() +
                      '-' +
                      item.token0.id.toLowerCase()
                  ];
                const gammaFarmAPRs = gammaPairs
                  ? gammaPairs.map((pair) => {
                      return {
                        title: pair.title,
                        apr:
                          gammaRewards &&
                          gammaRewards[pair.address.toLowerCase()] &&
                          gammaRewards[pair.address.toLowerCase()]['apr']
                            ? Number(
                                gammaRewards[pair.address.toLowerCase()]['apr'],
                              ) * 100
                            : undefined,
                      };
                    })
                  : [];
                const gammaPoolAPRs = gammaPairs
                  ? gammaPairs.map((pair) => {
                      return {
                        title: pair.title,
                        apr:
                          gammaData &&
                          gammaData[pair.address.toLowerCase()] &&
                          gammaData[pair.address.toLowerCase()]['returns'] &&
                          gammaData[pair.address.toLowerCase()]['returns'][
                            'allTime'
                          ] &&
                          gammaData[pair.address.toLowerCase()]['returns'][
                            'allTime'
                          ]['feeApr']
                            ? Number(
                                gammaData[pair.address.toLowerCase()][
                                  'returns'
                                ]['allTime']['feeApr'],
                              ) * 100
                            : 0,
                      };
                    })
                  : [];
                const quickFarmingAPR = aprs[ind].farmingApr;
                const farmingApr = Math.max(
                  quickFarmingAPR ?? 0,
                  ...gammaFarmAPRs.map((item) => Number(item.apr ?? 0)),
                );
                const quickPoolAPR = aprs[ind].apr;
                const apr = Math.max(
                  quickPoolAPR ?? 0,
                  ...gammaPoolAPRs.map((item) => Number(item.apr ?? 0)),
                );
                return {
                  ...item,
                  apr,
                  farmingApr,
                  quickFarmingAPR,
                  quickPoolAPR,
                  gammaFarmAPRs,
                  gammaPoolAPRs,
                };
              }),
            );
          } catch (e) {
            console.log(e);
          }
        }
      } else if (version === 'v2') {
        if (ethPrice.price) {
          const pairs = await getTopPairs(
            GlobalConst.utils.ANALYTICS_PAIRS_COUNT,
          );
          const formattedPairs = pairs
            ? pairs.map((pair: any) => {
                return pair.id;
              })
            : [];
          const data = await getBulkPairData(formattedPairs, ethPrice.price);
          if (data) {
            updateTopPairs(data);
          }
        }
      } else {
        const pairsData = await getTopPairsTotal(
          GlobalConst.utils.ANALYTICS_PAIRS_COUNT,
        );
        if (pairsData) {
          const data = pairsData.filter((item: any) => !!item);
          try {
            const aprs = await getPairsAPR(data.map((item: any) => item.id));
            const gammaRewards = await getGammaRewards(chainId);
            const gammaData = await getGammaData();

            updateTopPairs(
              data.map((item: any, ind: number) => {
                const gammaPairs = item.isV3
                  ? GammaPairs[
                      item.token0.id.toLowerCase() + '-' + item.token1.id
                    ]
                  : undefined;
                const gammaFarmAPRs = gammaPairs
                  ? gammaPairs.map((pair) => {
                      return {
                        title: pair.title,
                        apr:
                          gammaRewards &&
                          gammaRewards[pair.address.toLowerCase()] &&
                          gammaRewards[pair.address.toLowerCase()]['apr']
                            ? Number(
                                gammaRewards[pair.address.toLowerCase()]['apr'],
                              ) * 100
                            : undefined,
                      };
                    })
                  : [];
                const gammaPoolAPRs = gammaPairs
                  ? gammaPairs.map((pair) => {
                      return {
                        title: pair.title,
                        apr:
                          gammaData &&
                          gammaData[pair.address.toLowerCase()] &&
                          gammaData[pair.address.toLowerCase()]['returns'] &&
                          gammaData[pair.address.toLowerCase()]['returns'][
                            'allTime'
                          ] &&
                          gammaData[pair.address.toLowerCase()]['returns'][
                            'allTime'
                          ]['feeApr']
                            ? Number(
                                gammaData[pair.address.toLowerCase()][
                                  'returns'
                                ]['allTime']['feeApr'],
                              ) * 100
                            : 0,
                      };
                    })
                  : [];
                const quickFarmingAPR = aprs[ind].farmingApr;
                const farmingApr = Math.max(
                  quickFarmingAPR ?? 0,
                  ...gammaFarmAPRs.map((item) => Number(item.apr ?? 0)),
                );
                const quickPoolAPR = aprs[ind].apr;
                const apr = Math.max(
                  quickPoolAPR ?? 0,
                  ...gammaPoolAPRs.map((item) => Number(item.apr ?? 0)),
                );
                return {
                  ...item,
                  apr,
                  farmingApr,
                  quickFarmingAPR,
                  quickPoolAPR,
                  gammaFarmAPRs,
                  gammaPoolAPRs,
                };
              }),
            );
          } catch (e) {
            console.log(e);
          }
        }
      }
    })();
  }, [ethPrice.price, version, chainId]);

  useEffect(() => {
    updateTopPairs(null);
  }, [version]);

  useEffect(() => {
    if (topPairs) {
      dispatch(setAnalyticsLoaded(true));
    } else {
      dispatch(setAnalyticsLoaded(false));
    }
  }, [topPairs, dispatch]);

  return (
    <Box width='100%' mb={3}>
      <p>{t('allPairs')}</p>
      <Box mt={4} className='panel'>
        {topPairs ? (
          <PairTable data={topPairs} />
        ) : (
          <Skeleton variant='rectangular' width='100%' height={150} />
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsPairs;