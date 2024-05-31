import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { DoubleCurrencyLogo } from 'components';
import styles from 'styles/pages/pools/AutomaticLPItem.module.scss';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import GammaLPItemDetails from './GammaLPItemDetails';
import { useActiveWeb3React } from 'hooks';
import { ArrowRight } from 'react-feather';
import { useRouter } from 'next/router';
import { getGammaPairsForTokens } from 'utils';

const GammaLPItem: React.FC<{ gammaPosition: any }> = ({ gammaPosition }) => {
  const { t } = useTranslation();
  const { chainId } = useActiveWeb3React();
  const gammaPairData = getGammaPairsForTokens(
    chainId,
    gammaPosition?.token0?.address,
    gammaPosition?.token1?.address,
    gammaPosition?.feeAmount,
  );
  const gammaPair = gammaPairData?.pairs;
  const gammaPairInfo = gammaPair
    ? gammaPair.find(
        (item) =>
          item.address.toLowerCase() ===
          gammaPosition.pairAddress.toLowerCase(),
      )
    : undefined;
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const farmingLink = `/farm?tab=my-farms`;

  return (
    <Box className={styles.liquidityItem}>
      <Box className='flex items-center justify-between'>
        <Box className='flex items-center'>
          {gammaPosition.token0 && gammaPosition.token1 && (
            <>
              <Box className='flex' mr='8px'>
                <DoubleCurrencyLogo
                  currency0={gammaPosition.token0}
                  currency1={gammaPosition.token1}
                  size={24}
                />
              </Box>
              <p className='weight-600'>
                {gammaPosition.token0.symbol}/{gammaPosition.token1.symbol}
              </p>
            </>
          )}
          {gammaPairInfo?.fee && (
            <Box ml={1.5} mr={-0.5} className='gamma-liquidity-range'>
              <small>{gammaPairInfo.fee / 10000}%</small>
            </Box>
          )}
          {gammaPairInfo && (
            <Box ml={1.5} className={styles.liquidityRange}>
              <small>
                {gammaPairInfo.title} {t('range').toLowerCase()}
              </small>
            </Box>
          )}
          {gammaPosition && gammaPosition.farming && (
            <Box
              className='flex items-center cursor-pointer bg-primary'
              padding='0 5px'
              height='22px'
              borderRadius='11px'
              ml={1}
              my={0.5}
              color='white'
              onClick={() => router.push(farmingLink)}
            >
              <p className='span'>{t('farming')}</p>
              <Box className='flex' ml='3px'>
                <ArrowRight size={12} />
              </Box>
            </Box>
          )}
        </Box>

        <Box
          className={`${styles.liquidityItemExpand} ${
            expanded ? 'text-primary' : ''
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </Box>
      </Box>
      {expanded && gammaPosition && (
        <Box mt={2}>
          <GammaLPItemDetails gammaPosition={gammaPosition} />
        </Box>
      )}
    </Box>
  );
};

export default GammaLPItem;
