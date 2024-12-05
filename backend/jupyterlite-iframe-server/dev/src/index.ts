// https://github.com/jupyterlab/jupyterlab/tree/main/packages/application
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

// https://github.com/jupyterlab/jupyterlab/tree/main/packages/apputils
import {
  IThemeManager
} from '@jupyterlab/apputils';

// https://github.com/jupyterlab/jupyterlab/tree/main/packages/notebook
import {
  INotebookTracker,
  NotebookModel,
  Notebook,
  NotebookActions,
} from '@jupyterlab/notebook';

import {
  CellModel,
  IMarkdownCellModel,
} from '@jupyterlab/cells';

/**
 * Initialization data for the jupyterlab-iframe-bridge-example extension.
 * 
 * console.log() sends data to browser's developer console.
 * - open browser's developer tools (typically by pressing F12 or right-clicking on the page and selecting "Inspect"), 
 * - you'll see a "Console" tab or panel. 
 * - this is where the output from console.log() and other console methods will be displayed.
 */

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-iframe-bridge-example:plugin',
  autoStart: true,
  requires: [IThemeManager, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    themeManager: IThemeManager,
    notebookTracker: INotebookTracker,
  ) => {

    /* Function to get contents of the active cell */
    // const getActiveCellContent = (): string => {
    //   const model = notebookTracker.currentWidget?.content.activeCell?.model as CellModel;
    //   const content = model.sharedModel.getSource();
    //   console.log("[backend][index.ts][getActiveCellContent]\n", content);
    //   return content; // Return the content of the active cell
    // };
    const getActiveCellContent = (data: any): any => {
      const model = notebookTracker.currentWidget?.content.activeCell?.model as CellModel;
      const content = model.sharedModel.getSource();
      const cell_type = model.sharedModel.cell_type
      console.log("[backend][index.ts][getActiveCellContent]\n", content);
      const message = { type: 'from-iframe-to-host', 
        task: "getActiveCellContent", 
        ActiveCellContent: content,
        ActiveCellType: cell_type,
        target_id: data.target_id };
      console.log("[backend][index.ts][getActiveCellContent] message sent to host:", message);
      window.parent.postMessage(message, '*');
      return content; // Return the content of the active cell
    };

    /* Function to get contents of entire notebook */
    // const getContentsAllCells = (): string[] | null => {
    //   const model = notebookTracker.currentWidget?.content.model as NotebookModel;
    //   const cells = model.toJSON().cells;
    //   const contents = cells.map((cell: any) => cell.source); // Extract the source from each cell
    //   console.log("[backend][index.ts][getContentsAllCells]\n", contents);
    //   return contents; // Return an array of cell contents
    // };

    const getContentsAllCells = (data: any): string[] | null => {
      const model = notebookTracker.currentWidget?.content.model as NotebookModel;
      const cells = model.toJSON().cells;
      const contents = cells.map((cell: any) => cell.source); // Extract the source from each cell
      console.log("[backend][index.ts][getContentsAllCells]\n", contents);
      const message = { type: 'from-iframe-to-host', 
        task: "getContentsAllCells", 
        AllCellscontent: contents,
        target_id: data.target_id };
      console.log("[backend][index.ts][getActiveCellContent] message sent to host:", message);
      window.parent.postMessage(message, '*');
      return contents; // Return an array of cell contents
    };

    /* Function to change the theme */
    const changeTheme = (data: any): void => {
      if (themeManager.theme === 'JupyterLab Dark') {
        themeManager.setTheme('JupyterLab Light');
      } else {
        themeManager.setTheme('JupyterLab Dark');
      }
      const message = { type: 'from-iframe-to-host', task: "notifyThemeChanged", theme: themeManager.theme, target_id: data.target_id };
      console.log("[backend][index.ts][notifyThemeChanged] message sent to host:", message);
      window.parent.postMessage(message, '*');
    };

    const writeContentToCell =(data: any): void => {
      const newContent = data.newContent;
      const nb = notebookTracker.currentWidget?.content as Notebook;
      NotebookActions.insertBelow(nb);
      nb.activeCell?.model.sharedModel.setSource(newContent);
      NotebookActions.changeCellType(nb, "code");
      NotebookActions.run(nb);
      const message = { type: 'from-iframe-to-host', task: "writeContentToCell", target_id: data.target_id };
      console.log("[backend][index.ts][writeContentToCell] message sent to host:", message);
      window.parent.postMessage(message, '*');
    };

    // const fetchLLMResponse = async (inputText: string, endpoint: string): Promise<string | null> => {
    //   try {
    //     const response = await fetch(endpoint, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ input: inputText }),
    //     });

    //     console.log(response)
    //     if (!response.ok) {
    //       throw new Error(`HTTP error! status: ${response.status}`);
    //     }

    //     const content = await response.json();
    //     console.log("API Response:\n", content);

    //     return content;
    //   } catch (error) {
    //     console.error("Error fetching LLM response:", error);
    //     return null;
    //   }
    // };

    // const writeContentToCell = async (
    //   newContent: string,
    //   overwriteActiveCell: boolean,
    //   isMarkdown: boolean,
    // ): Promise<void> => {
    //   const nb = notebookTracker.currentWidget?.content as Notebook;

    //   // Determine the cell to update or create
    //   if (!overwriteActiveCell) {
    //     // Insert a new cell below the active cell
    //     NotebookActions.insertBelow(nb);
    //   }

    //   // Write new content
    //   nb.activeCell?.model.sharedModel.setSource(newContent);

    //   // Change cell type if necessary and run if markdown
    //   if (isMarkdown) {
    //     NotebookActions.changeCellType(nb, "markdown");
    //     NotebookActions.run(nb);
    //   }
    // };

    // const addCommentsToActiveCell = async (): Promise<void> => {
    //   const origContent = getActiveCellContent();
    //   const newContent = await fetchLLMResponse(origContent, 'http://localhost:8080/chat/addCommentsToActiveCell');
    //   if (!newContent) return;
    //   writeContentToCell(newContent, true, false);
    // }

    // const giveHintsToActiveCell = async (): Promise<void> => {
    //   const origContent = getActiveCellContent();
    //   const newContent = await fetchLLMResponse(origContent, 'http://localhost:8080/chat/giveHintsToActiveCell');
    //   if (!newContent) return;
    //   writeContentToCell(newContent, true, true);
    // }
    async function runTTS(text:string) {
      const url = 'http://127.0.0.1:8080/synthesize';
      const params = new URLSearchParams({ text: text });
  
      try {
          const response = await fetch(`${url}?${params.toString()}`);
          if (response.ok) {
              console.log("Speech synthesis completed successfully.");
          } else {
              console.error(`Error: ${response.status}, ${response.statusText}`);
          }
      } catch (error) {
          console.error(`Error: ${error}`);
      }
    }
    
    const extractAndInsertCell = async (
      cellIndexArray: number[],
      sourceFile: string,
      playSound: boolean
    ): Promise<void> => {
      console.log('jupyter cellIndexArray:', cellIndexArray);
      const contentManager = app.serviceManager.contents;
    
      try {
        // Read the source notebook
        const sourceNotebook = await contentManager.get(sourceFile, {
          type: 'notebook',
          format: 'json',
          content: true,
        });
    
        console.log(`Source Notebook Content:`, sourceNotebook.content);
    
        // Validate cellIndex
        if (
          !sourceNotebook.content ||
          !Array.isArray(sourceNotebook.content.cells) ||
          Math.min(...cellIndexArray) < 0 ||
          Math.max(...cellIndexArray) >= sourceNotebook.content.cells.length
        ) {
          console.error(`Cell index ${Math.max(...cellIndexArray)} is out of range.`);
          return;
        }

        let teach_content = "#";
        for (let i = 0; i < cellIndexArray.length; i++) {
          const cellIndex = cellIndexArray[i];

          // Extract the specified cell
          const cell = sourceNotebook.content.cells[cellIndex];
          // Get the currently active notebook
          const nb = notebookTracker.currentWidget?.content;
      
          if (!nb) {
            console.error(`No active notebook found.`);
            return;
          }
          
          const lastCellIndex = nb.widgets.length - 1;
          nb.activeCellIndex = lastCellIndex;
          NotebookActions.insertBelow(nb);

          var activeCell = nb.activeCell;
          if (activeCell) {
            console.log(`Active cell model:`, activeCell.model);
            console.log(`Active cell model sharedModel:`, activeCell.model.sharedModel);
          
            if (activeCell.model && activeCell.model.sharedModel) {
              // Change cell type if necessary
              if (cell.cell_type !== activeCell.model.type) {
                console.log("target notebook cell type", activeCell.model.type);
                NotebookActions.changeCellType(nb, cell.cell_type as 'code' | 'markdown' | 'raw');
                console.log("source notebook cell type", cell.cell_type);
                console.log("target notebook cell after copy", activeCell.model);
                // Update the cell content
              }
              activeCell = nb.activeCell
              console.log("target notebook cell after reassign", activeCell?.model);
              console.log("source notebook cell after reassign", cell.source);
              activeCell?.model.sharedModel.setSource(cell.source);
              console.log("target notebook cell after setSource", activeCell?.model);

              // const prompt1 = "#System Prompt#\n\nYour response must start with 'Let's take a look at this paragraph' or something similar. You can only generate a maximum of two or three sentences. You are teaching a child how to learn Python. Pls generate a question based on the current textbook content to make learning engaging.\n\n#textbook content#\n";
              
              // const prompt2 =  "#System Prompt#\n\nYour response must start with 'Now please take a look at the code on the left' or something similar.You are teaching a child how to learn Python. You can only generate a maximum of two or three sentences. Now the textbook paragraph is a code snippet. Please tell the child to run the code on the left and see if the result is as you expected.\n\n#textbook content#\n";

              // if (cell.cell_type === 'markdown') {
              //   const message = { type: 'from-iframe-to-chatbot', task: "teach", prompt: prompt1, content: cell.source };
              //   window.parent.postMessage(message, '*');
              // }
              // if (cell.cell_type === 'code') {
              //   const message = { type: 'from-iframe-to-chatbot', task: "teach", prompt: prompt2, content: cell.source };
              //   window.parent.postMessage(message, '*');
              // }
              let temp_content = "";
              if (cell.cell_type === 'markdown') {
                  temp_content = cell.source+"\n"
              }
              if (cell.cell_type === 'code') {
                  const wrappedSource = `'''python\n${cell.source}\n'''`;
                  temp_content = wrappedSource
              }

              teach_content += temp_content
              console.log(teach_content)
              console.log("11111")

              if (cell.attachments) {
                activeCell = nb.activeCell
                console.log('Cell has attachments:', cell.attachments);
                if (activeCell?.model.type === 'markdown') {
                  console.log('Active cell is a markdown cell');
                  (activeCell.model as IMarkdownCellModel).attachments.fromJSON(cell.attachments);
                  console.log('cell.attachments copied');
                } else {
                  console.warn('Cell has attachments but the active cell is not a markdown cell.');
                }
              } else {
                console.log('Cell does not have attachments');
              }
              // If the cell is markdown, run it to render
              if (cell.cell_type === 'markdown') {
                NotebookActions.run(nb);
              }
            } else {
              console.error(`Active cell model or sharedModel is not initialized.`);
            }
          } else {
            console.error(`No active cell to update.`);
          }
        }
        if(playSound){
          runTTS(teach_content)
        }
        const message = { type: 'from-iframe-to-chatbot', task: "teach", content: teach_content };
        window.parent.postMessage(message, '*');
      } catch (error) {
        console.error('Error extracting and inserting cell:', error);
      }
    };

    const debug =(): void => {
      const message = { type: 'from-iframe-to-chatbot', task: "debug" };
      window.parent.postMessage(message, '*');
    };

    const explain =(): void => {
      const message = { type: 'from-iframe-to-chatbot', task: "explain"};
      window.parent.postMessage(message, '*');
    };

    const comment =(): void => {
      const message = { type: 'from-iframe-to-chatbot', task: "comment"};
      window.parent.postMessage(message, '*');
    };





    /* Incoming messages management */
    window.addEventListener('message', (event) => {
      if (event.data.type === 'from-host-to-iframe') {
        console.log(event)
        console.log(event.data.type) // this is used
        console.log(event.data.task) // this is used
        console.log(event.data.message) // this isnt used

        switch (event.data.task) {
          case 'changeTheme':
            changeTheme(event.data);
            break;
          case 'getContentsAllCells':
            getContentsAllCells(event.data);
            break;
          case 'getActiveCellContent':
            getActiveCellContent(event.data);
            break;
          case 'writeContentToCell':
            writeContentToCell(event.data);
            break;
          case 'extractAndSaveCell':
            const {cellIndexArray, sourceFile, playSound} = event.data.message;
            extractAndInsertCell(cellIndexArray, sourceFile, playSound);
            break;
          case 'debug':
            debug()
            break;
          case 'explain':
            explain()
            break;
          case 'comment':
            comment()
            break;
          // case 'addCommentsToActiveCell':
          //   addCommentsToActiveCell();
          //   break;
          // case 'giveHintsToActiveCell':
          //   giveHintsToActiveCell();
          //   break;
          // case 'writeCodeToActiveCell':
          //   writeContentToCell('a=1', true, false);
          //   break;
          // case 'writeCodeBelowActiveCell':
          //   writeContentToCell('b=2', false, false);
          //   break;
          // case 'writeMarkdownToActiveCell':
          //   writeContentToCell('markdown here', true, true);
          //   break;
          // case 'writeMarkdownBelowActiveCell':
          //   writeContentToCell('markdown there', false, true);
          //   break;
          default:
            console.warn("[backend][index.ts][addEventListener] unknown task: ${event.data.task}");
            break;
        }
      }
    });

    /* Outgoing messages management */
    // const notifyThemeChanged = (): void => {
    //   const message = { type: 'from-iframe-to-host', task: "notifyThemeChanged", theme: themeManager.theme };
    //   console.log("[backend][index.ts][notifyThemeChanged] message sent to host:", message);
    //   window.parent.postMessage(message, '*');
    // };
    // themeManager.themeChanged.connect(notifyThemeChanged);
  },
};

export default plugin;