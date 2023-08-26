import { useToast } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { toastQueueSelector } from 'features/system/store/systemSelectors';
import { addToast, clearToastQueue } from 'features/system/store/systemSlice';
import { MakeToastArg, makeToast } from 'features/system/util/makeToast';
import { memo, useCallback, useEffect } from 'react';

/**
 * Logical component. Watches the toast queue and makes toasts when the queue is not empty.
 * @returns null
 */
const Toaster = () => {
  const dispatch = useAppDispatch();
  const toastQueue = useAppSelector(toastQueueSelector);
  const toast = useToast();
  useEffect(() => {
    toastQueue.forEach((t) => {
      toast(t);
    });
    toastQueue.length > 0 && dispatch(clearToastQueue());
  }, [dispatch, toast, toastQueue]);

  return null;
};

/**
 * Returns a function that can be used to make a toast.
 * @example
 * const toaster = useAppToaster();
 * toaster('Hello world!');
 * toaster({ title: 'Hello world!', status: 'success' });
 * @returns A function that can be used to make a toast.
 * @see makeToast
 * @see MakeToastArg
 * @see UseToastOptions
 */
export const useAppToaster = () => {
  const dispatch = useAppDispatch();
  const toaster = useCallback(
    (arg: MakeToastArg) => dispatch(addToast(makeToast(arg))),
    [dispatch]
  );

  return toaster;
};

export default memo(Toaster);
