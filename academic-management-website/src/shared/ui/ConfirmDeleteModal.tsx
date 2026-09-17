import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDeleteModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    loading?: boolean;
    error?: string;
}

const ConfirmDeleteModal = ({ open, onClose, onConfirm, itemName, loading = false, error }: ConfirmDeleteModalProps) => {
    const { t } = useTranslation("common");
    return (
        <Modal
            open={open}
            onClose={onClose}
            closeDisabled={loading}
            title={t("confirmDeleteModal.title")}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {t("confirmDeleteModal.cancel")}
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        {t("confirmDeleteModal.delete")}
                    </Button>
                </>
            }
        >
            <p className="text-body text-secondary">
                {t("confirmDeleteModal.confirmPrefix")} <span className="font-semibold text-primary">{itemName}</span>{t("confirmDeleteModal.confirmSuffix")}
            </p>
            {error && <p className="mt-3 text-body-sm text-status-danger-text">{error}</p>}
        </Modal>
    );
};

export default ConfirmDeleteModal;
