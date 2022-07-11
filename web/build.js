// Cube Web App Build Script

const fs = require("fs");
const UglifyJS = require("uglify-js");

const filePath = 'public/javascripts/components/';
const fileList = [
    'Dialog.js',
    'MainPanel.js',
    'EmojiPanel.js',
    'FileDetails.js',
    'SidebarAccountPanel.js',
    'MessageCatalogue.js',
    'MessagePanel.js',
    'MessageSidebar.js',
    'VoiceCallPanel.js',
    'VideoChatPanel.js',
    'VoiceGroupCallPanel.js',
    'VideoGroupChatPanel.js',
    'ContactDetails.js',
    'GroupDetails.js',
    'NewGroupDialog.js',
    'ContactListDialog.js',
    'MessagingController.js',
    'CallController.js',
    'FileCatalogue.js',
    'FileTable.js',
    'FilePanel.js',
    'FileSharingTable.js',
    'FileSharingPanel.js',
    'FileController.js',
    'ContactsTable.js',
    'GroupsTable.js',
    'PendingTable.js',
    'BlockListTable.js',
    'ContactsController.js',
    'ConferenceTimeline.js',
    'ConferenceController.js',
    'SelectContactsDialog.js',
    'SearchDialog.js',
    'AppEventCenter.js'
];

const output = 'public/javascripts/components-min.js';

/**
 * 合并文件
 */
function merge() {
    let output = 'public/javascripts/components.js';

    try {
        // 删除旧文件
        if (fs.existsSync(output)) {
            fs.unlinkSync(output);
        }
    } catch (e) {
        console.log(e);
    }

    for (let i = 0; i < fileList.length; ++i) {
        let file = filePath + fileList[i];
        let data = fs.readFileSync(file, 'utf8');

        if (i == 0) {
            fs.appendFileSync(output, data.substr(0, 1184));
        }

        fs.appendFileSync(output, data.substr(1184, data.length - 1184));
    }

    console.log('merge ' + fileList.length + ' files to ' + output);
}

function main() {
    // 合并文件
    merge();

    console.log('Start "UglifyJS.minify()"');

    let code = {};

    for (let i = 0; i < fileList.length; ++i) {
        let file = filePath + fileList[i];
        code[fileList[i]] = fs.readFileSync(file, "utf8");
    }

    let options = {
        warnings: true,
        output: {
            beautify: false
        },
        sourceMap: {
            filename: "components-min.js",
            url: "components-min.js.map"
        }
    };
    let result = UglifyJS.minify(code, options);

    fs.writeFileSync(output, result.code);

    console.log('Finish "UglifyJS.minify()"');
}

main();
