import type {
  MirrorablePublication,
  UnknownOpenActionModuleSettings
} from '@hey/lens';
import type { FC } from 'react';

import Loader from '@components/Shared/Loader';
import { REWARDS_ADDRESS } from '@hey/data/constants';
import { useModuleMetadataQuery } from '@hey/lens';
import { Button, Card } from '@hey/ui';
import isFeatureAvailable from '@lib/isFeatureAvailable';
import useActOnUnknownOpenAction from 'src/hooks/useActOnUnknownOpenAction';
import { encodeAbiParameters, encodePacked } from 'viem';

interface SwapOpenActionProps {
  module: UnknownOpenActionModuleSettings;
  publication: MirrorablePublication;
}

const SwapOpenAction: FC<SwapOpenActionProps> = ({ module, publication }) => {
  const { data, loading } = useModuleMetadataQuery({
    skip: !Boolean(module?.contract.address),
    variables: { request: { implementation: module?.contract.address } }
  });

  const metadata = data?.moduleMetadata?.metadata;

  const { actOnUnknownOpenAction, isLoading } = useActOnUnknownOpenAction({
    signlessApproved: module.signlessApproved,
    successToast: "You've successfully swapped!"
  });

  if (!isFeatureAvailable('swap-oa')) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <Loader className="p-5" message="Loading swap open action..." small />
      </Card>
    );
  }

  const act = async () => {
    const abi = JSON.parse(metadata?.processCalldataABI);

    const calldata = encodeAbiParameters(abi, [
      encodePacked(
        ['address', 'uint24', 'address'],
        [
          '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', // Input WMATIC
          3000, // Amount
          '0x3d2bD0e15829AA5C362a4144FdF4A1112fa29B5c' // Output BONSAI
        ]
      ),
      Math.floor(Date.now() / 1000) + 20 * 60,
      10,
      0,
      REWARDS_ADDRESS
    ]);

    return await actOnUnknownOpenAction({
      address: module.contract.address,
      data: calldata,
      publicationId: publication.id
    });
  };

  return (
    <Card className="space-y-3 p-5">
      <Button disabled={isLoading} onClick={act}>
        Act
      </Button>
    </Card>
  );
};

export default SwapOpenAction;