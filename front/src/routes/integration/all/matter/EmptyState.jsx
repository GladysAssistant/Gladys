import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const EmptyState = ({ matterEnabled }) => (
  <div class="col-md-12">
    <div class="text-center mt-5 mb-5">
      <Text id="integration.matter.device.noDeviceFound" />

      {matterEnabled && (
        <div class="mt-5">
          <Text id="integration.matter.discoverDeviceDescr" />
          <Link href="/dashboard/integration/device/matter/discover">
            <button class="btn btn-outline-primary ml-2">
              <Text id="integration.matter.addTab" /> <i class="fe fe-plus-circle" />
            </button>
          </Link>
        </div>
      )}
    </div>
  </div>
);

export default EmptyState;
