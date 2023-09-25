import { FormControl, FormLabel, Tooltip, forwardRef } from '@chakra-ui/react';
import { MultiSelect, MultiSelectProps } from '@mantine/core';
import { useAppDispatch } from 'app/store/storeHooks';
import { shiftKeyPressed } from 'features/ui/store/hotkeysSlice';
import { useMantineMultiSelectStyles } from 'mantine-theme/hooks/useMantineMultiSelectStyles';
import { KeyboardEvent, RefObject, memo, useCallback } from 'react';

type IAIMultiSelectProps = Omit<MultiSelectProps, 'label'> & {
  tooltip?: string;
  inputRef?: RefObject<HTMLInputElement>;
  label?: string;
};

const IAIMantineMultiSelect = forwardRef((props: IAIMultiSelectProps, ref) => {
  const {
    searchable = true,
    tooltip,
    inputRef,
    label,
    disabled,
    ...rest
  } = props;
  const dispatch = useAppDispatch();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.shiftKey) {
        dispatch(shiftKeyPressed(true));
      }
    },
    [dispatch]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!e.shiftKey) {
        dispatch(shiftKeyPressed(false));
      }
    },
    [dispatch]
  );

  const styles = useMantineMultiSelectStyles();

  return (
    <Tooltip label={tooltip} placement="top" hasArrow isOpen={true}>
      <FormControl ref={ref} isDisabled={disabled} position="static">
        {label && <FormLabel>{label}</FormLabel>}
        <MultiSelect
          ref={inputRef}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          searchable={searchable}
          maxDropdownHeight={300}
          styles={styles}
          {...rest}
        />
      </FormControl>
    </Tooltip>
  );
});

IAIMantineMultiSelect.displayName = 'IAIMantineMultiSelect';

export default memo(IAIMantineMultiSelect);
