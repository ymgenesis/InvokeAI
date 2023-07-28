import { Flex, Text } from '@chakra-ui/react';

import { useState } from 'react';
import {
  MainModelConfigEntity,
  DiffusersModelConfigEntity,
  LoRAModelConfigEntity,
  useGetMainModelsQuery,
  useGetLoRAModelsQuery,
} from 'services/api/endpoints/models';
import CheckpointModelEdit from './ModelManagerPanel/CheckpointModelEdit';
import DiffusersModelEdit from './ModelManagerPanel/DiffusersModelEdit';
import LoRAModelEdit from './ModelManagerPanel/LoRAModelEdit';
import ModelList from './ModelManagerPanel/ModelList';
import { ALL_BASE_MODELS } from 'services/api/constants';

export default function ModelManagerPanel() {
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const { mainModel } = useGetMainModelsQuery(ALL_BASE_MODELS, {
    selectFromResult: ({ data }) => ({
      mainModel: selectedModelId ? data?.entities[selectedModelId] : undefined,
    }),
  });
  const { loraModel } = useGetLoRAModelsQuery(undefined, {
    selectFromResult: ({ data }) => ({
      loraModel: selectedModelId ? data?.entities[selectedModelId] : undefined,
    }),
  });

  const model = mainModel ? mainModel : loraModel;

  return (
    <Flex sx={{ gap: 8, w: 'full', h: 'full' }}>
      <ModelList
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
      />
      <ModelEdit model={model} />
    </Flex>
  );
}

type ModelEditProps = {
  model: MainModelConfigEntity | LoRAModelConfigEntity | undefined;
};

const ModelEdit = (props: ModelEditProps) => {
  const { model } = props;

  if (model?.model_format === 'checkpoint') {
    return <CheckpointModelEdit key={model.id} model={model} />;
  }

  if (model?.model_format === 'diffusers') {
    return (
      <DiffusersModelEdit
        key={model.id}
        model={model as DiffusersModelConfigEntity}
      />
    );
  }

  if (model?.model_type === 'lora') {
    return <LoRAModelEdit key={model.id} model={model} />;
  }

  return (
    <Flex
      sx={{
        w: 'full',
        h: 'full',
        justifyContent: 'center',
        alignItems: 'center',
        maxH: 96,
        userSelect: 'none',
      }}
    >
      <Text variant="subtext">No Model Selected</Text>
    </Flex>
  );
};
