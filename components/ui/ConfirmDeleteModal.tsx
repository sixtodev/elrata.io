'use client'

import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  loading?: boolean
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Eliminar?',
  description = 'Esta acción no se puede deshacer.',
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-sm"
    >
      <div className="flex gap-3 justify-end mt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          loading={loading}
          onClick={onConfirm}
          className="bg-red text-white border-transparent hover:bg-red/80 hover:shadow-none hover:translate-y-0"
        >
          Sí, eliminar
        </Button>
      </div>
    </Modal>
  )
}
