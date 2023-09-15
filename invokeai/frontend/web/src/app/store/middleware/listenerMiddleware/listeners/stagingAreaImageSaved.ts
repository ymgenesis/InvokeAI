import { stagingAreaImageSaved } from 'features/canvas/store/actions';
import { addToast } from 'features/system/store/systemSlice';
import { imagesApi } from 'services/api/endpoints/images';
import { startAppListening } from '..';
import { t } from 'i18next';

export const addStagingAreaImageSavedListener = () => {
  startAppListening({
    actionCreator: stagingAreaImageSaved,
    effect: async (action, { dispatch, getState }) => {
      const { imageDTO } = action.payload;

      try {
        const newImageDTO = await dispatch(
          imagesApi.endpoints.changeImageIsIntermediate.initiate({
            imageDTO,
            is_intermediate: false,
          })
        ).unwrap();

        // we may need to add it to the autoadd board
        const { autoAddBoardId } = getState().gallery;

        if (autoAddBoardId && autoAddBoardId !== 'none') {
          await dispatch(
            imagesApi.endpoints.addImageToBoard.initiate({
              imageDTO: newImageDTO,
              board_id: autoAddBoardId,
            })
          );
        }
        dispatch(addToast({ title: t('toast.imageSaved'), status: 'success' }));
      } catch (error) {
        dispatch(
          addToast({
            title: t('toast.imageSavingFailed'),
            description: (error as Error)?.message,
            status: 'error',
          })
        );
      }
    },
  });
};
