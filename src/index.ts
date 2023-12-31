import {
  ILayoutRestorer,
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application'
import { IFileBrowserFactory, FileBrowserModel } from '@jupyterlab/filebrowser'
import { Dialog, showErrorMessage } from '@jupyterlab/apputils'
import { IChangedArgs } from '@jupyterlab/coreutils'
import { getServerSettings, IServerSettings } from './api'
import { AssignmentWidget } from './widgets'
import { EduhelxSubmissionModel } from './model'
import { submissionIcon } from './style/icons'

async function activate (
  app: JupyterFrontEnd,
  restorer: ILayoutRestorer,
  shell: ILabShell,
  fileBrowserFactory: IFileBrowserFactory
) {
  let serverSettings: IServerSettings
  const fileBrowser = fileBrowserFactory.defaultBrowser
  try {
    serverSettings = await getServerSettings()
  } catch (e: any) {
    console.error('Failed to load the jupyterlab_eduhelx_submission extension settings', e)
    showErrorMessage(
      'Failed to load the jupyterlab_eduhelx_submission server extension',
      e.message,
      [Dialog.warnButton({ label: 'Dismiss' })]
    )
    return
  }

  const model = new EduhelxSubmissionModel()
  Promise.all([app.restored, fileBrowser.model.restored]).then(() => {
    model.currentPath = fileBrowser.model.path
  })
  fileBrowser.model.pathChanged.connect((fileBrowserModel: FileBrowserModel, change: IChangedArgs<string>) => {
    model.currentPath = change.newValue
  })

  const submissionWidget = new AssignmentWidget(
    model,
    app.commands,
    serverSettings
  )
  submissionWidget.id = 'jp-submission-widget'
  submissionWidget.title.icon = submissionIcon
  submissionWidget.title.caption = 'Submit assignments'

  restorer.add(submissionWidget, 'submission-widget')
  shell.add(submissionWidget, 'left', { rank: 200 })
}

/**
 * Initialization data for the jupyterlab_eduhelx_submission extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_eduhelx_submission:plugin',
  description: 'A JupyterLab extension tfor submitting assignments in EduHeLx',
  autoStart: true,
  requires: [
    ILayoutRestorer,
    ILabShell,
    IFileBrowserFactory
  ],
  activate
};

export default plugin;
