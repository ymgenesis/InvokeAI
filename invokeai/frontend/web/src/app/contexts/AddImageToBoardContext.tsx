import { useDisclosure } from '@chakra-ui/react';
import { PropsWithChildren, createContext, useCallback, useState } from 'react';
import { ImageDTO } from 'services/api/types';
import { imagesApi } from 'services/api/endpoints/images';
import { useAppDispatch } from '../store/storeHooks';

export type ImageUsage = {
  isInitialImage: boolean;
  isCanvasImage: boolean;
  isNodesImage: boolean;
  isControlNetImage: boolean;
};

type AddImageToBoardContextValue = {
  /**
   * Whether the move image dialog is open.
   */
  isOpen: boolean;
  /**
   * Closes the move image dialog.
   */
  onClose: () => void;
  /**
   * The image pending movement
   */
  image?: ImageDTO;
  onClickAddToBoard: (image: ImageDTO) => void;
  handleAddToBoard: (boardId: string) => void;
};

export const AddImageToBoardContext =
  createContext<AddImageToBoardContextValue>({
    isOpen: false,
    onClose: () => undefined,
    onClickAddToBoard: () => undefined,
    handleAddToBoard: () => undefined,
  });

type Props = PropsWithChildren;

export const AddImageToBoardContextProvider = (props: Props) => {
  const [imageToMove, setImageToMove] = useState<ImageDTO>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useAppDispatch();

  // Clean up after deleting or dismissing the modal
  const closeAndClearImageToDelete = useCallback(() => {
    setImageToMove(undefined);
    onClose();
  }, [onClose]);

  const onClickAddToBoard = useCallback(
    (image?: ImageDTO) => {
      if (!image) {
        return;
      }
      setImageToMove(image);
      onOpen();
    },
    [setImageToMove, onOpen]
  );

  const handleAddToBoard = useCallback(
    (boardId: string) => {
      if (imageToMove) {
        dispatch(
          imagesApi.endpoints.addImageToBoard.initiate({
            imageDTO: imageToMove,
            board_id: boardId,
          })
        );
        closeAndClearImageToDelete();
      }
    },
    [dispatch, closeAndClearImageToDelete, imageToMove]
  );

  return (
    <AddImageToBoardContext.Provider
      value={{
        isOpen,
        image: imageToMove,
        onClose: closeAndClearImageToDelete,
        onClickAddToBoard,
        handleAddToBoard,
      }}
    >
      {props.children}
    </AddImageToBoardContext.Provider>
  );
};
