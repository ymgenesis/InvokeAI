import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  useEditableControls,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { nodeLabelChanged } from 'features/nodes/store/nodesSlice';
import { InvocationNodeData, NotesNodeData } from 'features/nodes/types/types';
import { MouseEvent, memo, useCallback, useState } from 'react';

interface Props {
  data: InvocationNodeData | NotesNodeData;
  title: string;
}

const NodeTitle = (props: Props) => {
  const { data, title } = props;
  const { label } = data;
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(label || title);

  const handleSubmit = useCallback(
    async (newTitle: string) => {
      setIsEditing(false);
      // empty strings are not allowed
      if (!newTitle.trim()) {
        setLocalTitle(title);
        return;
      }

      // don't updated the board name if it hasn't changed
      if (newTitle === (label || title)) {
        return;
      }

      dispatch(nodeLabelChanged({ nodeId: data.id, label: newTitle }));

      // update local state
      setLocalTitle(newTitle);
    },
    [data.id, dispatch, title, label]
  );

  const handleChange = useCallback((newTitle: string) => {
    setLocalTitle(newTitle);
  }, []);

  return (
    <Flex
      className={isEditing ? 'nopan' : DRAG_HANDLE_CLASSNAME}
      sx={{
        overflow: 'hidden',
        w: 'full',
        h: 'full',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEditing ? 'text' : undefined,
      }}
    >
      <Editable
        value={localTitle}
        onChange={handleChange}
        onSubmit={handleSubmit}
        sx={{
          position: 'relative',
          w: 'full',
        }}
      >
        <EditablePreview
          fontSize="sm"
          sx={{
            p: 0,
            textAlign: 'center',
            fontWeight: 600,
            color: 'base.700',
            _dark: { color: 'base.200' },
          }}
          noOfLines={1}
        />
        <EditableInput
          fontSize="sm"
          sx={{
            p: 0,
            fontWeight: 600,
            _focusVisible: {
              p: 0,
              textAlign: 'center',
              boxShadow: 'none',
            },
          }}
        />
        <EditableControls setIsEditing={setIsEditing} />
      </Editable>
    </Flex>
  );
};

export default memo(NodeTitle);

type EditableControlsProps = {
  setIsEditing: (isEditing: boolean) => void;
};

function EditableControls(props: EditableControlsProps) {
  const { isEditing, getEditButtonProps } = useEditableControls();
  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const { onClick } = getEditButtonProps();
      if (!onClick) {
        return;
      }
      onClick(e);
      props.setIsEditing(true);
    },
    [getEditButtonProps, props]
  );

  return isEditing ? null : (
    <Box
      onDoubleClick={handleDoubleClick}
      sx={{
        position: 'absolute',
        w: 'full',
        h: 'full',
        top: 0,
      }}
    />
  );
}
