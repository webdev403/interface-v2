import React, { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material/';
import Image from 'next/image';
import { SUPPORTED_CHAINIDS } from 'constants/index';
import { getConfig } from 'config/index';
import { useActiveWeb3React } from 'hooks';
import { useTranslation } from 'react-i18next';
import { ChainId } from '@uniswap/sdk';
import { useIsSupportedNetwork } from 'utils';
import styles from 'styles/components/Dropdown.module.scss';
import {
  networkConnection,
  walletConnectConnection,
  zengoConnectConnection,
} from 'connectors';
import { useArcxAnalytics } from '@arcxmoney/analytics';
import CustomTabSwitch from 'components/v3/CustomTabSwitch';

const NetworkSelectionDropdown: React.FC = () => {
  const { t } = useTranslation();
  const arcxSdk = useArcxAnalytics();
  const { chainId, connector, account } = useActiveWeb3React();
  const networkTypes = [
    { id: 'mainnet', text: t('mainnets') },
    { id: 'testnet', text: t('testnets') },
  ];
  const [networkType, setNetworkType] = useState('mainnet');

  const supportedChains = SUPPORTED_CHAINIDS.filter((chain) => {
    const config = getConfig(chain);
    return (
      config &&
      config.visible &&
      config.isMainnet === (networkType === 'mainnet')
    );
  });
  const isSupportedNetwork = useIsSupportedNetwork();

  useEffect(() => {
    const localChainId = localStorage.getItem('localChainId');

    if (
      localChainId &&
      Number(localChainId) !== chainId &&
      connector === networkConnection.connector
    ) {
      connector.activate(Number(localChainId));
    } else {
      connector.activate(chainId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchNetwork = useCallback(
    async (chainId: ChainId) => {
      const config = getConfig(chainId);
      const chainParam = {
        chainId,
        chainName: `${config['networkName']} Network`,
        rpcUrls: [config['rpc']],
        nativeCurrency: config['nativeCurrency'],
        blockExplorerUrls: [config['blockExplorer']],
      };
      if (
        connector === walletConnectConnection.connector ||
        connector === zengoConnectConnection.connector ||
        connector === networkConnection.connector
      ) {
        await connector.activate(chainId);
      } else {
        await connector.activate(chainParam);
      }
      if (arcxSdk && account) {
        await arcxSdk.chain({ chainId, account });
      }
      localStorage.setItem('localChainId', chainId.toString());
    },
    [account, arcxSdk, connector],
  );

  return (
    <Box className='networkSelectionDropdown'>
      <p>{t('selectNetwork')}</p>
      <Box className='networkTypeWrapper'>
        <CustomTabSwitch
          items={networkTypes}
          value={networkType}
          handleTabChange={setNetworkType}
          height={40}
        />
      </Box>
      {supportedChains.map((chain) => {
        const config = getConfig(chain);
        return (
          <Box
            className='networkItemWrapper'
            key={chain}
            onClick={() => {
              switchNetwork(chain);
            }}
          >
            <Box className='flex items-center'>
              <img
                src={config['nativeCurrencyImage']}
                alt='network Image'
                className='networkIcon'
              />
              <small className='weight-600'>{config['networkName']}</small>
            </Box>
            {isSupportedNetwork && chainId && chainId === chain && (
              <img
                src={"assets/images/chainActiveDot.png"}
                alt='chain active'
                width={12}
                height={12}
              />
            )}
          </Box>
        );
      })}
      {networkType === 'mainnet' && (
        <Box
          className={styles.networkItemWrapper}
          onClick={() => {
            window.open('https://kinetix.finance/home', '_blank');
          }}
        >
          <Box className='flex items-center'>
            <Image
              src='/assets/images/KAVA.png'
              alt='network Image'
              width={24}
              height={24}
            />
            <small className='weight-600'>Kava - Kinetix</small>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NetworkSelectionDropdown;
