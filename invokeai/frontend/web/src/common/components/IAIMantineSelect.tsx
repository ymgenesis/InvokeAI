import { FormControl, FormLabel, Tooltip, forwardRef } from '@chakra-ui/react';
import { Select, SelectProps } from '@mantine/core';
import { useMantineSelectStyles } from 'mantine-theme/hooks/useMantineSelectStyles';
import { RefObject, memo } from 'react';

export type IAISelectDataType = {
  value: string;
  label: string;
  tooltip?: string;
};

export type IAISelectProps = Omit<SelectProps, 'label'> & {
  tooltip?: string;
  inputRef?: RefObject<HTMLInputElement>;
  label?: string;
};

const IAIMantineSelect = forwardRef((props: IAISelectProps, ref) => {
  const { tooltip, inputRef, label, disabled, required, ...rest } = props;

  const styles = useMantineSelectStyles();

  return (
    <Tooltip label={tooltip} placement="top" hasArrow>
      <FormControl
        ref={ref}
        isRequired={required}
        isDisabled={disabled}
        position="static"
      >
        <FormLabel>{label}</FormLabel>
        <Select disabled={disabled} ref={inputRef} styles={styles} {...rest} />
      </FormControl>
    </Tooltip>
  );
});

IAIMantineSelect.displayName = 'IAIMantineSelect';

export default memo(IAIMantineSelect);
