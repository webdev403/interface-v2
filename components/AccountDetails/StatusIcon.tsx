import React from 'react';
import { Box } from '@mui/material';
import { useActiveWeb3React } from 'hooks';
import { getWalletKeys } from 'utils';
import Image from 'next/image';

const StatusIcon: React.FC = () => {
  const { connector } = useActiveWeb3React();
  const icon = getWalletKeys(connector).map(
    (connection) => connection.iconName,
  )[0];
  return (
    <Box className='flex items-center'>
      <Image src={icon} width={24} height={24} alt='wallet icon' />
    </Box>
  );
};

export default StatusIcon;