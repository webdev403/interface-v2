import React, { useRef } from 'react';
import  Box from '@mui/material/Box';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useOpenNetworkSelection } from 'state/application/hooks';
import { useIsSupportedNetwork } from 'utils';
import { useActiveWeb3React } from 'hooks';
import { getConfig } from 'config/index';
import NetworkSelectionDropdown from 'components/NetworkSelectionDropdown';
import { useTranslation } from 'react-i18next';
import { useOnClickOutside } from 'hooks/v3/useOnClickOutside';

export const NetworkSelection: React.FC = () => {
  const {
    openNetworkSelection,
    setOpenNetworkSelection,
  } = useOpenNetworkSelection();
  const isSupportedNetwork = useIsSupportedNetwork();
  const { chainId } = useActiveWeb3React();
  const config = getConfig(chainId);
  const { t } = useTranslation();
  const networkSelection = useRef<any>(null);
  useOnClickOutside(networkSelection, () => {
    setOpenNetworkSelection(false);
  });

  return (
    <div className='networkSelectionWrapper' ref={networkSelection}>
      <Box
        className='networkSelection'
        onClick={() => setOpenNetworkSelection(!openNetworkSelection)}
      >
        {isSupportedNetwork && (
          <Box className='networkSelectionImage'>
            {chainId && (
              
              <img
                src="assets/images/chainActiveDot.png"
                alt='chain active'
                className='networkActiveDot'
              />
            )}
            <img src={config['nativeCurrencyImage']} alt='network Image' />
          </Box>
        )}
        <small className='network-name'>
          {isSupportedNetwork ? config['networkName'] : t('wrongNetwork')}
        </small>
        {openNetworkSelection ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      </Box>
      {openNetworkSelection && <NetworkSelectionDropdown />}
    </div>
  );
};
