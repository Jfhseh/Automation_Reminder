const environment_vars = PropertiesService.getScriptProperties();
const DOCUMENT_ID = "1vBBThG9yQxRJDkeJ2CPmKKw562mNMBb5yNod4ORQ94c";
const Email_EiCconfig = {
    name: 'Bot',
    noReply: true,
    cc: String(["gye25@cgps.org"/**replace my email with EiC's email  */])
};
const Email_CopyEditorsconfig = {
    name: 'Bot',
    noReply: true,
     cc: String(["gye25@cgps.org","gye25@cgps.org"/**replace my email with CopyEditor's emails  */])
};
const Email_FinalEditsconfig = {
    name: 'Bot',
    noReply: true,
    
};
function compareName(x,y) {
    if (x[1] < y[1]) {
      return -1;
    }
    if (x[1] > y[1]) {
      return 1;
    }
    return 0;
}
function myFunction() {
  const doc = DocumentApp.getActiveDocument();
  const id = doc.getId();
  const url = "https://docs.google.com/feeds/download/documents/export/Export?exportFormat=txt&id=" + id;
  const blob = UrlFetchApp.fetch(url, { headers: { authorization: "Bearer " + ScriptApp.getOAuthToken() } }).getBlob();
  const tempFile = DriveApp.createFile(blob);
  const tempFileId = tempFile.getId();
  Logger.log(tempFileId)
  //const tempDoc = DocumentApp.openByUrl(tempFile.getUrl());
  let text = tempFile.getBlob().getDataAsString().split("Name: ");
  let isComplete = true;
  let info = [];
  for (const i of text) {
    if (isComplete) {
      info.push([]);
      let lines = i.split('\n');
      info[info.length-1].push(lines[lines.length-4]);
      isComplete = false;
      continue;
    }
    info[info.length-1].push(i.split('\n')[0]);
    isComplete = true;
  }
  Logger.log(info);

  DriveApp.getFileById(tempFileId).setTrashed(true); // If you want to delete the tempolary document, please use this.
  // DriveApp.createFile(); // This is used for automatically detecting the scope by the script editor.
  let newChanges = checkNewChanges(info);
  Logger.log(newChanges);
  if(newChanges.length > 0)
    emailChanges(newChanges);
  info.sort(compareName);
  environment_vars.setProperty("lastStatus", JSON.stringify(info));
}

function checkNewChanges(status) {
  let lastStatus = JSON.parse(environment_vars.getProperty('lastStatus'));
  lastStatus.sort(compareName);
  status.sort(compareName);
  Logger.log(lastStatus);
  if (lastStatus == null || lastStatus == "") return [];
  // list = JSON.parse(lastStatus)
  ret = []
  let deltaI = 0;
  for (let i = 0; i < Math.min(status.length, lastStatus.length); i++) {
    if (status[i+deltaI][1] !== lastStatus[i][1]) //not same person
    while (status[i+deltaI][1] !== lastStatus[i][1])  {
      Logger.log({curr:status[i+deltaI][1], prev:lastStatus[i][1]})
      ret.push(status[i]);
      deltaI++;
      if (i+deltaI >=  status.length) {
        Logger.log("ERROR line 57 deltaI exceed bound");
        break;
      }
    }
    // try {
      if (status[i+deltaI][0]
       != lastStatus[i][0]) {//
      Logger.log({current:status[i+deltaI][0], last:lastStatus[i][0]});
      ret.push(status[i+deltaI]);
      }
    //  } catch (error) {
    //    Logger.log(error);
    //  }
  }
  return ret;
}

function emailChanges(changes) {
  let copyeditors = [];  let final_edit = []; let chief = [];
  let others = [];
  for (const a of changes) {
    Logger.log(a[0]);
      if (a[0] === "Approved by copyeditors; needs EiC\r")
        chief.push(a[1]);
      else if (a[0] === "EiC approved; needs Yashin\r") {
        final_edit.push(a[1]);
      } else if (a[0] === "Ready for copyeditors\r") {
        copyeditors.push(a[1]);
      } else {
        others.push(a[1]);
      }
  }
  if (copyeditors.length > 0) {
      email("👍 Ready for Copyeditors to edit!", "To Copyeditors: \n  "+copyeditors+ " are ready for edit!" );
  }
   if (final_edit.length > 0) {
      email("👍 Sympossium Text ready for you to edit!", " \n  "+final_edit+ " are ready for edit!" );
  }
  if (chief.length > 0) {
      email("👍 Ready for Editor In Chief to edit!", "To EiC: \n  "+chief+ " are ready for edit!" );
  }
  if (others.length > 0) {
     email("👍 Ready for Others to edit!", "To EiC: \n  "+others+ " are ready for edit!" );
  }
}

function email(title, msg) {
  GmailApp.sendEmail('gye25@cgps.org', title, msg,  Email_config);
}
function no() {
  
}
