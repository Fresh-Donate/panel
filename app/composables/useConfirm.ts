import ConfirmModal from '~/components/ConfirmModal.vue'

type ConfirmOptions = InstanceType<typeof ConfirmModal>['$props']

export function useConfirm() {
  const overlay = useOverlay()

  return async (options: ConfirmOptions): Promise<boolean> => {
    const confirmed = await overlay.create(ConfirmModal, { destroyOnClose: true }).open(options)
    return confirmed === true
  }
}
