import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { BigNumber } from '@ethersproject/bignumber';
import { useV3PositionFromTokenId } from 'hooks/v3/useV3Positions';
import RemoveLiquidityV3 from 'components/v3/RemoveLiquidityV3';
import { Box } from '@mui/material';

export default function RemoveLiquidityV3Page() {
  const router = useRouter();
  const tokenId = router.query.tokenId
    ? (router.query.tokenId as string)
    : undefined;
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId);
    } catch {
      return;
    }
  }, [tokenId]);

  const { position } = useV3PositionFromTokenId(parsedTokenId);

  if (!position) {
    router.push('/pools/v3');
    return <></>;
  }

  return (
    <Box className='wrapper'>
      <RemoveLiquidityV3 position={position} />
    </Box>
  );
}