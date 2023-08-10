import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  useEditableControls,
  useOutsideClick,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { fieldLabelChanged } from 'features/nodes/store/nodesSlice';
import {
  InputFieldTemplate,
  InputFieldValue,
} from 'features/nodes/types/types';
import { MouseEvent, memo, useCallback, useState } from 'react';
import FieldContextMenu from './FieldContextMenu';
import { useDraggable } from '@dnd-kit/core';

interface Props {
  nodeId: string;
  field: InputFieldValue;
  fieldTemplate: InputFieldTemplate;
}

const FieldTitle = (props: Props) => {
  const { nodeId, field, fieldTemplate } = props;
  const { label } = field;
  const { title } = fieldTemplate;
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(label || title);

  const { setNodeRef, attributes, listeners } = useDraggable({
    id: `${nodeId}-${field.name}`,
    data: { nodeId, fieldName: field.name },
  });

  const handleSubmit = useCallback(
    async (newTitle: string) => {
      setIsEditing(false);
      dispatch(
        fieldLabelChanged({ nodeId, fieldName: field.name, label: newTitle })
      );
      setLocalTitle(newTitle || title);
    },
    [dispatch, nodeId, field.name, title]
  );

  const handleChange = useCallback((newTitle: string) => {
    setLocalTitle(newTitle);
  }, []);

  return (
    <Flex
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // className={isEditing ? 'nopan' : DRAG_HANDLE_CLASSNAME}
      className="nopan"
      sx={{
        overflow: 'hidden',
        w: 'full',
        h: 'full',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
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
            textAlign: 'left',
          }}
          noOfLines={1}
        />
        <EditableInput
          fontSize="sm"
          sx={{
            p: 0,
            _focusVisible: {
              p: 0,
              textAlign: 'left',
              boxShadow: 'none',
            },
          }}
        />
        <EditableControls setIsEditing={setIsEditing} />
      </Editable>
    </Flex>
  );
};

export default memo(FieldTitle);

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
