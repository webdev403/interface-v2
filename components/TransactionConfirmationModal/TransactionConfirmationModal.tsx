import { ChainId } from '@uniswap/sdk';
import React from 'react';
import { Box, Button } from '@mui/material';
import { CustomModal } from 'components';
import { Close } from '@mui/icons-material';
import TransactionFailed from 'svgs/TransactionFailed.svg';
import TransactionSuccess from 'svgs/TransactionSuccess.svg';
import { getEtherscanLink } from 'utils';
import { useActiveWeb3React } from 'hooks';
import 'components/styles/TransactionConfirmationModal.scss';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface ConfirmationPendingContentProps {
  onDismiss: () => void;
  pendingText?: string;
}

export const ConfirmationPendingContent: React.FC<ConfirmationPendingContentProps> = ({
  onDismiss,
  pendingText,
}) => {
  const { t } = useTranslation();
  return (
    <Box padding={4}>
      <Box className='txModalHeader'>
        <Close onClick={onDismiss} />
      </Box>
      <Box className='txModalContent'>
        <Box my={4} className='flex justify-center spinner'>
          <Image src='/images/spinner.svg' alt='Spinner' />
        </Box>
        <h5>{t('waitingConfirm')}</h5>
        {pendingText && <p>{pendingText}</p>}
        <p>{t('confirmTxinWallet')}</p>
      </Box>
    </Box>
  );
};

interface TransactionSubmittedContentProps {
  onDismiss: () => void;
  hash: string | undefined;
  chainId: ChainId;
  txPending?: boolean;
  modalContent: string;
}

export const TransactionSubmittedContent: React.FC<TransactionSubmittedContentProps> = ({
  onDismiss,
  chainId,
  hash,
  txPending,
  modalContent,
}) => {
  const { t } = useTranslation();
  return (
    <Box padding={4}>
      <Box className='txModalHeader'>
        <h5>{txPending ? t('txSubmitted') : t('txCompleted')}</h5>
        <Close onClick={onDismiss} />
      </Box>
      {!txPending && (
        <Box mt={8} className='flex justify-center'>
          <TransactionSuccess />
        </Box>
      )}
      <Box className='txModalContent'>
        <p>{modalContent}</p>
      </Box>
      <Box className='flex justify-between' mt={2}>
        {chainId && hash && (
          <a
            href={getEtherscanLink(chainId, hash, 'transaction')}
            target='_blank'
            rel='noopener noreferrer'
            style={{ width: '48%', textDecoration: 'none' }}
          >
            <Button className='txSubmitButton'>
              {t('viewonBlockExplorer')}
            </Button>
          </a>
        )}
        <Button
          className='txSubmitButton'
          style={{ width: '48%' }}
          onClick={onDismiss}
        >
          {t('close')}
        </Button>
      </Box>
    </Box>
  );
};

interface ConfirmationModalContentProps {
  title: string;
  onDismiss: () => void;
  content: () => React.ReactNode;
}

export const ConfirmationModalContent: React.FC<ConfirmationModalContentProps> = ({
  title,
  onDismiss,
  content,
}) => {
  return (
    <Box padding={4}>
      <Box className='txModalHeader'>
        <h5>{title}</h5>
        <Close onClick={onDismiss} />
      </Box>
      {content()}
    </Box>
  );
};

export const ConfirmationModalContentV3: React.FC<ConfirmationModalContentProps> = ({
  title,
  onDismiss,
  content,
}) => {
  return (
    <Box padding={4}>
      <Box className='flex items-center justify-between'>
        <p>{title}</p>
        <Close onClick={onDismiss} />
      </Box>
      {content()}
    </Box>
  );
};

interface TransactionErrorContentProps {
  message: string;
  onDismiss: () => void;
}

export const TransactionErrorContent: React.FC<TransactionErrorContentProps> = ({
  message,
  onDismiss,
}) => {
  const { t } = useTranslation();
  return (
    <Box padding={4}>
      <Box>
        <Box className='txModalHeader'>
          <h5 className='text-error'>Error!</h5>
          <Close onClick={onDismiss} />
        </Box>
        <Box className='txModalContent'>
          <TransactionFailed />
          <p>{message}</p>
        </Box>
      </Box>
      <Button className='txSubmitButton' onClick={onDismiss}>
        {t('dismiss')}
      </Button>
    </Box>
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  hash: string | undefined;
  content: () => React.ReactNode;
  attemptingTxn: boolean;
  pendingText?: string;
  modalContent: string;
  txPending?: boolean;
  modalWrapper?: string;
}

const TransactionConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onDismiss,
  attemptingTxn,
  txPending,
  hash,
  pendingText,
  content,
  modalContent,
  modalWrapper,
}) => {
  const { chainId } = useActiveWeb3React();

  if (!chainId) return null;

  // confirmation screen
  return (
    <CustomModal open={isOpen} onClose={onDismiss} modalWrapper={modalWrapper}>
      <Image src='/images/ModalBG.svg' alt='Modal Back' className='txModalBG' />
      <Box position='relative' zIndex={2}>
        {attemptingTxn ? (
          <ConfirmationPendingContent
            onDismiss={onDismiss}
            pendingText={pendingText}
          />
        ) : hash ? (
          <TransactionSubmittedContent
            chainId={chainId}
            txPending={txPending}
            hash={hash}
            onDismiss={onDismiss}
            modalContent={modalContent}
          />
        ) : (
          content()
        )}
      </Box>
    </CustomModal>
  );
};

export default TransactionConfirmationModal;