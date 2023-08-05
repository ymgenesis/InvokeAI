import { imageDeletionConfirmed } from 'features/deleteImageModal/store/actions';
import { selectImageUsage } from 'features/deleteImageModal/store/selectors';
import {
  imagesToDeleteSelected,
  isModalOpenChanged,
} from 'features/deleteImageModal/store/slice';
import { startAppListening } from '..';

export const addImageToDeleteSelectedListener = () => {
  startAppListening({
    actionCreator: imagesToDeleteSelected,
    effect: async (action, { dispatch, getState }) => {
      const imageDTOs = action.payload;
      const state = getState();
      const { shouldConfirmOnDelete } = state.system;
      const imagesUsage = selectImageUsage(getState());

      const isImageInUse =
        imagesUsage.some((i) => i.isCanvasImage) ||
        imagesUsage.some((i) => i.isInitialImage) ||
        imagesUsage.some((i) => i.isControlNetImage) ||
        imagesUsage.some((i) => i.isNodesImage);

      if (shouldConfirmOnDelete || isImageInUse) {
        dispatch(isModalOpenChanged(true));
        return;
      }

      dispatch(imageDeletionConfirmed({ imageDTOs, imagesUsage }));
    },
  });
};
