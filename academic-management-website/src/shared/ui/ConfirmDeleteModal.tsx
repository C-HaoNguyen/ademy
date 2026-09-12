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
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Xác nhận xóa"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        Xóa
                    </Button>
                </>
            }
        >
            <p className="text-body text-secondary">
                Xóa <span className="font-semibold text-primary">{itemName}</span>? Hành động này không thể hoàn tác.
            </p>
            {error && <p className="mt-3 text-body-sm text-status-danger-text">{error}</p>}
        </Modal>
    );
};

export default ConfirmDeleteModal;
