/**
 * @deprecated Use HandoverCertificateModal directly instead.
 * This wrapper forwards props to HandoverCertificateModal with defaultTab="tag".
 */
import HandoverCertificateModal from './HandoverCertificateModal';

export default function CustodyTagModal(props) {
    return <HandoverCertificateModal {...props} defaultTab="tag" />;
}
