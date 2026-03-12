export const AGREEMENT_PREFIX_TEXT = '请先阅读并同意'
export const PRIVACY_POLICY_TEXT = '《隐私政策》'
export const SERVICE_AGREEMENT_TEXT = '《服务协议》'
export const DIALOG_TITLE_TEXT = '请阅读并同意'
export const DIALOG_CONTENT_TEXT = '继续操作需同意《隐私政策》《服务协议》'

export const ensureAgreementBefore = (agreementRef: any, onAgree: () => void) => {
  const agreed = agreementRef?.validateAgreed?.() ?? false
  if (!agreed) {
    agreementRef?.openDialog?.(onAgree)
    return false
  }
  return true
}

