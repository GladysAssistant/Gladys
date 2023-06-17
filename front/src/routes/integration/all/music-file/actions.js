import { RequestStatus } from '../../../../utils/consts';
import { MUSIC } from '../../../../../../server/utils/constants';
import { MUSICFILE } from '../../../../../../server/services/music-file/lib/utils/musicFile.constants';

const actions = store => ({
  updateDefaultFolder(state, e) {
    store.setState({
      musicFileDefaultFolder: e.target.value
    });
  },
  async getConfig(state) {
    store.setState({
      musicFileGetStatus: RequestStatus.Getting
    });
    let musicFileEnableProviderVariable = MUSIC.PROVIDER.STATUS.DISABLED;
    let defaultFolderVariable;
    let readSubFolderVariable;
    try {
      let tmpVar = await state.httpClient.get(`/api/v1/music/${MUSICFILE.SERVICE_NAME}`);
      musicFileEnableProviderVariable = tmpVar ? tmpVar.status : MUSIC.PROVIDER.STATUS.DISABLED;
      tmpVar = await state.httpClient.get(
        `/api/v1/service/${MUSICFILE.SERVICE_NAME}/variable/${MUSICFILE.DEFAULT_FOLDER}`
      );
      defaultFolderVariable = tmpVar ? tmpVar.value : MUSIC.PROVIDER.STATUS.DISABLED;
      tmpVar = await state.httpClient.get(
        `/api/v1/service/${MUSICFILE.SERVICE_NAME}/variable/${MUSICFILE.READ_SUBFOLDER}`
      );
      readSubFolderVariable = tmpVar ? tmpVar.value : MUSIC.PROVIDER.STATUS.DISABLED;
    } catch (e) {
      console.error('Music file service not configured');
    } finally {
      store.setState({
        musicFileGetStatus: RequestStatus.Success,
        musicFileEnableProvider: musicFileEnableProviderVariable,
        musicFileDefaultFolder: defaultFolderVariable,
        musicFileReadSubFolder: readSubFolderVariable
      });
    }
  },
  async saveDefaultFolder(state, e) {
    e.preventDefault();
    store.setState({
      musicFileSaveStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        musicFileDefaultFolder: state.musicFileDefaultFolder.trim()
      });

      // save default foler
      await state.httpClient.post(`/api/v1/service/${MUSICFILE.SERVICE_NAME}/variable/${MUSICFILE.DEFAULT_FOLDER}`, {
        value: state.musicFileDefaultFolder.trim()
      });
      // force reload service conf
      await state.httpClient.post(`/api/v1/service/${MUSICFILE.SERVICE_NAME}/start`);
      store.setState({
        musicFileSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        musicFileSaveStatus: RequestStatus.Error
      });
    }
  },
  async enableMusicFileProvider(state, newStatus) {
    store.setState({
      musicFileSaveStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        musicFileEnableProvider: newStatus
      });

      // save default foler
      await state.httpClient.post(`/api/v1/music/${MUSICFILE.SERVICE_NAME}/${newStatus}`, {
        value: newStatus
      });
      // force reload service conf
      await state.httpClient.post(`/api/v1/service/${MUSICFILE.SERVICE_NAME}/start`);
      store.setState({
        musicFileSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        musicFileSaveStatus: RequestStatus.Error
      });
    }
  },
  async enableReadSubFolder(state, newStatus) {
    store.setState({
      musicFileSaveStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        musicFileReadSubFolder: newStatus
      });

      // save default foler
      await state.httpClient.post(`/api/v1/service/${MUSICFILE.SERVICE_NAME}/variable/${MUSICFILE.READ_SUBFOLDER}`, {
        value: newStatus
      });
      // force reload service conf
      await state.httpClient.post(`/api/v1/service/${MUSICFILE.SERVICE_NAME}/start`);
      store.setState({
        musicFileSaveStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        musicFileSaveStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
