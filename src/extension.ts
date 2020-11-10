import * as vscode from "vscode";
import handleErrorState from "./binary/errorState";
import pollDownloadProgress from "./binary/pollDownloadProgress";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "./binary/requests/requests";
import {
  Capability,
  fetchCapabilitiesOnFocus,
  isCapabilityEnabled,
} from "./capabilities";
import { registerCommands } from "./commandsHandler";
import { COMPLETION_TRIGGERS } from "./consts";
import { tabnineContext } from "./extensionContext";
import handleUninstall from "./handleUninstall";
import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_IMPORTS, selectionHandler } from "./selectionHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar";
import { closeValidator } from "./validator/ValidatorClient";
import pollNotifications from "./notifications/pollNotifications";

export function activate(context: vscode.ExtensionContext): Promise<void> {
  // const pasteDisposable = vscode.commands.registerTextEditorCommand(
  //   PASTE_COMMAND,
  //   (
  //     textEditor: vscode.TextEditor,
  //     edit: vscode.TextEditorEdit,
  //     args: any[]
  //   ) => {
  //     vscode.commands.executeCommand("editor.action.clipboardPasteAction");
  //   }
  // );
  initBinary();
  handleSelection(context);
  handleUninstall();
  registerStatusBar(context);

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  return Promise.resolve();
}

async function backgroundInit(context: vscode.ExtensionContext) {
  // Goes to the binary to fetch what capabilities enabled:
  await fetchCapabilitiesOnFocus();

  pollNotifications();
  setDefaultStatus();
  registerCommands(context);
  pollDownloadProgress();
  vscode.languages.registerCompletionItemProvider(
    { pattern: "**" },
    {
      provideCompletionItems,
    },
    ...COMPLETION_TRIGGERS
  );

  // if (isCapabilityEnabled(Capability.VALIDATOR_CAPABILITY)) {
  //   setImmediate(() => {
  //     initValidator(context, pasteDisposable);
  //   });
  // }

  if (isCapabilityEnabled(Capability.ON_BOARDING_CAPABILITY)) {
    handleErrorState();
  }
}

export async function deactivate(): Promise<unknown> {
  void closeValidator();

  return requestDeactivate();
}

function handleSelection(context: vscode.ExtensionContext) {
  if (tabnineContext.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        selectionHandler
      )
    );
  }
}
