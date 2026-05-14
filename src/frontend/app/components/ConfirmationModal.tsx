import type Lang from "~/interfaces/lang";
import Modal from "./Modal";
import ModalFooter from "./ModalFooter";
import ModalFooterButton from "./ModalFooterButton";
import ModalHeader from "./ModalHeader";

function ConfirmationModal({
  lang,
  onCancel,
  onConfirm,
}: {
  lang: Lang;
  onCancel: () => void;
  onConfirm: (lang: string) => void;
}) {
  return (
    <Modal>
      <ModalHeader title="Change source language" />
      <div className="m-4">
        <div className="flex">
          <div className="mr-1">{"Are you sure to change source language to"}</div>
          <div className="font-bold">{`${lang.name}`}</div>
          <div className="ml-1">{"?"}</div>
        </div>
        <div>
          {"All explanations, text to speech audios, translations will be lost"}
        </div>
      </div>
      <ModalFooter>
        <ModalFooterButton onClick={onCancel} type="secondary" text="Cancel" />
        <ModalFooterButton
          onClick={() => onConfirm(lang.id)}
          type="primary"
          text="Confirm"
        />
      </ModalFooter>
    </Modal>
  );
}

export default ConfirmationModal;
