export type { GatewayResult } from "./_internal";

export {
  checkInstall,
  verifyInstall,
  startInstall,
  inspectInstallTarget,
  validateHermesHome,
  adoptHermesHome,
  quitApp,
  onInstallProgress,
} from "./install";

export {
  getHermesVersion,
  refreshHermesVersion,
  runHermesDoctor,
  runHermesUpdate,
  runHermesBackup,
  runHermesImport,
  runHermesDump,
} from "./hermes-engine";

export {
  oauthLogin,
  cancelOAuthLogin,
  onOAuthLoginProgress,
} from "./oauth";

export { getLocale, setLocale } from "./locale";

export {
  getEnv,
  setEnv,
  getConfig,
  setConfig,
  getHermesHome,
  readConfigYaml,
  writeConfigYaml,
} from "./env-config";

export {
  getModelConfig,
  getRoutingConfig,
  setModelConfig,
  discoverProviderModels,
  listModels,
  listTemplates,
  getModelAliases,
  addModel,
  removeModel,
  updateModel,
  checkNeedsMigration,
  runModelMigration,
  readModelStore,
  registerProvider,
  unregisterProvider,
  saveModel,
  deleteModel,
} from "./models";

export {
  isRemoteMode,
  isRemoteOnlyMode,
  getConnectionConfig,
  setConnectionConfig,
  setSshConfig,
  testRemoteConnection,
  testSshConnection,
  isSshTunnelActive,
  startSshTunnel,
  stopSshTunnel,
  getGatewayWsPort,
} from "./connection";

export {
  startGateway,
  stopGateway,
  gatewayStatus,
  homeHealthSummary,
  copyDiagnostics,
  runtimeHealth,
} from "./gateway";

export {
  copyToClipboard,
  getPathForFile,
  openExternal,
  selectFolder,
  selectHermesFolder,
  readLogs,
  getPlatformEnabled,
  setPlatformEnabled,
  getPluginMetrics,
  getCredentialPool,
  setCredentialPool,
} from "./system";

export {
  abortChat,
  stageAttachment,
  clearStagedAttachments,
  tuiSlashExec,
  tuiCommandDispatch,
  tuiCompress,
  tuiSetGoal,
  tuiSetModel,
  tuiSteer,
  tuiCreateSession,
  tuiResumeSession,
  tuiSessionHistory,
  tuiSubmitPrompt,
  tuiInterrupt,
  tuiUndo,
  tuiToolsList,
  tuiToolsShow,
  tuiToolsConfigure,
  tuiApprovalRespond,
  tuiClarifyRespond,
  tuiSudoRespond,
  tuiSecretRespond,
  tuiSessionTitle,
  tuiSessionStatus,
  tuiSessionActiveList,
  tuiSessionUsage,
  tuiSessionBranch,
  tuiCompleteSlash,
  tuiCommandsCatalog,
  voiceTts,
} from "./chat";

export {
  listSessions,
  getRelatedSessionIds,
  getSessionMessages,
  getSessionMessagesBefore,
  deleteSession,
  deleteSessionChain,
  listCachedSessions,
  syncSessionCache,
  searchSessions,
  listProfiles,
  createProfile,
  deleteProfile,
  setActiveProfile,
} from "./sessions";

export {
  readMemory,
  addMemoryEntry,
  updateMemoryEntry,
  removeMemoryEntry,
  writeUserProfile,
  writeMemory,
  readSoul,
  writeSoul,
  resetSoul,
  discoverMemoryProviders,
  listMcpServers,
} from "./memory";

export {
  getToolsets,
  setToolsetEnabled,
  listInstalledSkills,
  listBundledSkills,
  getSkillContent,
  installSkill,
  uninstallSkill,
  getPlugins,
  setPluginEnabled,
} from "./extensions";

export {
  listCronJobs,
  createCronJob,
  updateCronJob,
  removeCronJob,
  pauseCronJob,
  resumeCronJob,
  triggerCronJob,
  listCronHistory,
  readCronOutput,
} from "./cron";

export {
  kanbanListBoards,
  kanbanCurrentBoard,
  kanbanSwitchBoard,
  kanbanCreateBoard,
  kanbanRemoveBoard,
  kanbanListTasks,
  kanbanGetTask,
  kanbanCreateTask,
  kanbanAssignTask,
  kanbanCompleteTask,
  kanbanBlockTask,
  kanbanUnblockTask,
  kanbanArchiveTask,
  kanbanSpecifyTask,
  kanbanReclaimTask,
  kanbanCommentTask,
  kanbanDispatchOnce,
} from "./kanban";

export {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getAppVersion,
  getBuildInfo,
  onUpdateAvailable,
  onUpdateDownloadProgress,
  onUpdateDownloaded,
  onUpdateError,
  onMenuNewChat,
  onMenuSearchSessions,
} from "./updates";

export {
  voiceModelStatus,
  voiceDownloadModel,
  voiceStart,
  voiceStop,
  onVoiceDownloadProgress,
  onVoiceRecordingStopped,
} from "./voice";

export { onTuiEvent } from "./events";
