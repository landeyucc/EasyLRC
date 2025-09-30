/**
 * 繁體中文語言包
 */
const zh_TW = {
    // 頁面標題
    "title": "EasyLRC",
    "subtitle": "輕鬆製作同步歌詞，支持逐行和逐字模式",
    
    // 音頻文件區域
    "audio_file": "音頻文件",
    "upload_audio": "上傳音頻文件",
    
    // 歌詞上下文
    noLyric: '無',

    // 確認對話框
    confirmOperationTitle: '確認操作',
    confirmOperationMessage: '您確定要執行此操作嗎？',
    confirmText: '確定',
    cancelText: '取消',

    // 元資料
    metaArtist: '歌手/藝術家',
    metaTitle: '歌曲名/標題',
    metaAlbum: '專輯名',
    metaLyricCreator: '歌詞製作/編輯者',
    metaOffset: '時間偏移量',
    metaLength: '歌曲總時長',
    metaSinger: '演唱者',
    metaArranger: '編曲者',
    metaVersion: '版本資訊',
    metaComposer: '作曲者',
    metaLyricist: '作詞人',
    metaTranslator: '翻譯者',
    metaLanguage: '歌詞語言',

    // 歌詞編輯/刪除/跳轉
    editLyricTitle: '編輯歌詞',
    editLyricMessage: '請編輯歌詞內容：',
    confirmDeleteTitle: '確認刪除',
    confirmDeleteMessage: '確定要刪除這句歌詞嗎？',
    operationSuccessTitle: '操作成功',
    lyricDeletedMessage: '歌詞已刪除',
    jumpToLyric: '已跳轉處理至第 {index} 句歌詞',
    
    // 雙語歌詞
    bilingual_enabled_title: '雙語歌詞已啟用',
    bilingual_enabled_message: '文本輸入：單數行為歌詞，雙數行為翻譯\nLRC導入：將識別"/"後的內容作為翻譯',

    // 檔案偵測
    audioFileDetected: '偵測到 {count} 個音訊檔案，僅載入第一個',
    lyricFileDetected: '偵測到 {count} 個歌詞檔案，僅載入第一個',

    // 提示對話框
    promptInputTitle: '請輸入',
    timeInputLabel: '時間 (分:秒.百分秒):',
    translationInputLabel: '翻譯:',
    lyricContentLabel: '歌詞內容:',
    tipTitle: '提示',
    uploadAudioAndTagLyrics: '請先上傳音訊並完成歌詞時間標記',
    noLyricData: '無歌詞資料',
    noValidTimedLyrics: '沒有找到有效的時間標記歌詞',

    // 歌詞輸入區域
    "lyricInputTitle": "歌詞輸入",
    "lyric_input": "歌詞輸入",
    "text_input": "文本輸入",
    "import_lrc": "導入LRC",
    "enable_bilingual": "啟用雙語歌詞",
    "bilingual_tooltip": "啟用後：文本輸入將單數行作為歌詞，雙數行作為翻譯；導入LRC時將識別"/"後的內容或雙行格式作為翻譯",
    "lyric_textarea_placeholder": "在此輸入歌詞，將按換行符、逗號和句號自動分割...\n啟用雙語歌詞後：單數行為歌詞，雙數行為翻譯（可留空行）",
    "split_lyric": "分割歌詞",
    "upload_lrc": "上傳LRC文件",
    "parsing_mode": "解析模式",
    "default_mode": "預設模式（按原LRC行順序解析）",
    "strict_mode": "嚴格模式（按時間碼排序導入）",
    
    // 打節奏控制區域
    "timing_controls": "打節奏控制",
    "process_mode": "處理模式",
    "line_mode": "逐行處理",
    "char_mode": "逐字處理",
    "reset": "重置",
    "prev_lyric": "上一條",
    "next_lyric": "下一條",
    "prev_lyric_text": "上一歌詞: ",
    "current_lyric_text": "當前處理: ",
    "next_lyric_text": "下一歌詞: ",
    "none": "無",
    "back_2s": "後退2秒",
    "forward_2s": "前進2秒",
    "play_pause": "播放/暫停",
    "mark_time": "標記時間",
    
    // 歌詞預覽區域
    "lyric_preview": "歌詞預覽",
    "lyric_preview_placeholder": "請輸入歌詞並分割，或導入LRC文件",
    "add_blank_lyric": "添加空白歌詞",
    
    // 時間調整區域
    "time_adjustment": "時間調整",
    "adjustment_desc": "調整所有時間碼（秒.毫秒，如: 0.500 或 -0.200）",
    "adjustment_placeholder": "輸入調整值",
    "apply_adjustment": "應用調整",
    "next_step": "下一步：預覽同步效果",
    
    // 預覽界面
    "sync_preview": "歌詞同步預覽",
    "sync_preview_placeholder": "播放音頻開始預覽歌詞同步效果",
    "back_to_edit": "上一步：返回編輯",
    "export_lrc": "導出LRC文件",
    
    // 元數據區域
    "lyric_metadata": "歌詞元數據",
    "meta_ar": "[ar] 歌手/藝術家:",
    "meta_ar_placeholder": "歌手姓名",
    "meta_ti": "[ti] 歌曲名/標題:",
    "meta_ti_placeholder": "歌曲名稱",
    "meta_al": "[al] 專輯名:",
    "meta_al_placeholder": "專輯名稱",
    "meta_by": "[by] 歌詞製作/編輯者:",
    "meta_by_placeholder": "製作者姓名",
    "meta_offset": "[offset] 時間偏移量 (毫秒):",
    "meta_offset_placeholder": "0",
    "meta_length": "[length] 歌曲總時長:",
    "meta_length_placeholder": "00:00.00",
    "meta_au": "[au] 演唱者:",
    "meta_au_placeholder": "演唱者姓名",
    "meta_re": "[re] 編曲者:",
    "meta_re_placeholder": "編曲者姓名",
    "meta_ve": "[ve] 版本信息:",
    "meta_ve_placeholder": "版本號或描述",
    "meta_composer": "[composer] 作曲者:",
    "meta_composer_placeholder": "作曲者姓名",
    "meta_lyricist": "[lyricist] 作詞人:",
    "meta_lyricist_placeholder": "作詞人姓名",
    "meta_translator": "[translator] 翻譯者:",
    "meta_translator_placeholder": "翻譯者姓名",
    "meta_language": "[language] 歌詞語言:",
    "meta_language_placeholder": "語言名稱",
    
    // 浮動按鈕
    "toggle_theme": "切換主題",
    "github_project": "GitHub項目",
    
    // 消息提示
    "message_title": "提示",
    "leave_confirm": "您正在編輯歌詞，確定要離開嗎？",
    
    // 按鍵操作提示
    "key_open_file": "已觸發文件選擇對話框",
    "key_play_pause": "播放/暫停切換",
    "key_back_2s": "後退2秒",
    "key_forward_2s": "前進2秒",
    "key_prev_lyric": "已切換到上一句歌詞",
    "key_next_lyric": "已切換到下一句歌詞",
    "key_mark_time": "已標記當前時間點",
    
    // 語言選擇
    "language": "語言",
    "lang_zh_cn": "簡體中文",
    "lang_zh_tw": "繁體中文",
    "lang_en": "English"
};