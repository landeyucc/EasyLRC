/**
 * 简体中文语言包
 */
const zh_CN = {
    // 页面标题
    "title": "EasyLRC",
    "subtitle": "轻松制作同步歌词，支持逐行和逐字模式",
    
    // 音频文件区域
    "audio_file": "音频文件",
    "upload_audio": "上传音频文件",
    
    // 歌词上下文
    noLyric: '无',

    // 确认对话框
    confirmOperationTitle: '确认操作',
    confirmOperationMessage: '您确定要执行此操作吗？',
    confirmText: '确定',
    cancelText: '取消',

    // 元数据
    metaArtist: '歌手/艺术家',
    metaTitle: '歌曲名/标题',
    metaAlbum: '专辑名',
    metaLyricCreator: '歌词制作/编辑者',
    metaOffset: '时间偏移量',
    metaLength: '歌曲总时长',
    metaSinger: '演唱者',
    metaArranger: '编曲者',
    metaVersion: '版本信息',
    metaComposer: '作曲者',
    metaLyricist: '作词人',
    metaTranslator: '翻译者',
    metaLanguage: '歌词语言',

    // 歌词编辑/删除/跳转
    editLyricTitle: '编辑歌词',
    editLyricMessage: '请编辑歌词内容：',
    confirmDeleteTitle: '确认删除',
    confirmDeleteMessage: '确定要删除这句歌词吗？',
    operationSuccessTitle: '操作成功',
    lyricDeletedMessage: '歌词已删除',
    jumpToLyric: '已跳转处理至第 {index} 句歌词',
    
    // 双语歌词
    bilingual_enabled_title: '双语歌词已启用',
    bilingual_enabled_message: '文本输入：单数行为歌词，双数行为翻译\nLRC导入：将识别"/"后的内容作为翻译',

    // 文件检测
    audioFileDetected: '检测到 {count} 个音频文件，仅加载第一个',
    lyricFileDetected: '检测到 {count} 个歌词文件，仅加载第一个',

    // 提示对话框
    promptInputTitle: '请输入',
    timeInputLabel: '时间 (分:秒.百分秒):',
    translationInputLabel: '翻译:',
    lyricContentLabel: '歌词内容:',
    tipTitle: '提示',
    uploadAudioAndTagLyrics: '请先上传音频并完成歌词时间标记',
    noLyricData: '无歌词数据',
    noValidTimedLyrics: '没有找到有效的时间标记歌词',

    // 歌词输入区域
    "lyricInputTitle": "歌词输入",
    "lyric_input": "歌词输入",
    "text_input": "文本输入",
    "import_lrc": "导入LRC",
    "enable_bilingual": "启用双语歌词",
    "bilingual_tooltip": "启用后：文本输入将单数行作为歌词，双数行作为翻译；导入LRC时将识别"/"后的内容或双行格式作为翻译",
    "lyric_textarea_placeholder": "在此输入歌词，将按换行符、逗号和句号自动分割...\n启用双语歌词后：单数行为歌词，双数行为翻译（可留空行）",
    "split_lyric": "分割歌词",
    "upload_lrc": "上传LRC文件",
    "parsing_mode": "解析模式",
    "default_mode": "默认模式（按LRC行内顺序解析）",
    "strict_mode": "严格模式（按时间码排序导入）",
    
    // 打节奏控制区域
    "timing_controls": "打节奏控制",
    "process_mode": "处理模式",
    "line_mode": "逐行处理",
    "char_mode": "逐字处理",
    "reset": "重置",
    "prev_lyric": "上一条",
    "next_lyric": "下一条",
    "prev_lyric_text": "上一歌词: ",
    "current_lyric_text": "当前处理: ",
    "next_lyric_text": "下一歌词: ",
    "none": "无",
    "back_2s": "后退2秒",
    "forward_2s": "前进2秒",
    "play_pause": "播放/暂停",
    "mark_time": "标记时间",
    
    // 歌词预览区域
    "lyric_preview": "歌词预览",
    "lyric_preview_placeholder": "请输入歌词并分割，或导入LRC文件",
    "add_blank_lyric": "添加空白歌词",
    
    // 时间调整区域
    "time_adjustment": "时间调整",
    "adjustment_desc": "调整所有时间码（秒.毫秒，如: 0.500 或 -0.200）",
    "adjustment_placeholder": "输入调整值",
    "apply_adjustment": "应用调整",
    "next_step": "下一步：预览同步效果",
    
    // 预览界面
    "sync_preview": "歌词同步预览",
    "sync_preview_placeholder": "播放音频开始预览歌词同步效果",
    "back_to_edit": "上一步：返回编辑",
    "export_lrc": "导出LRC文件",
    
    // 元数据区域
    "lyric_metadata": "歌词元数据",
    "meta_ar": "[ar] 歌手/艺术家:",
    "meta_ar_placeholder": "歌手姓名",
    "meta_ti": "[ti] 歌曲名/标题:",
    "meta_ti_placeholder": "歌曲名称",
    "meta_al": "[al] 专辑名:",
    "meta_al_placeholder": "专辑名称",
    "meta_by": "[by] 歌词制作/编辑者:",
    "meta_by_placeholder": "制作者姓名",
    "meta_offset": "[offset] 时间偏移量 (毫秒):",
    "meta_offset_placeholder": "0",
    "meta_length": "[length] 歌曲总时长:",
    "meta_length_placeholder": "00:00.00",
    "meta_au": "[au] 演唱者:",
    "meta_au_placeholder": "演唱者姓名",
    "meta_re": "[re] 编曲者:",
    "meta_re_placeholder": "编曲者姓名",
    "meta_ve": "[ve] 版本信息:",
    "meta_ve_placeholder": "版本号或描述",
    "meta_composer": "[composer] 作曲者:",
    "meta_composer_placeholder": "作曲者姓名",
    "meta_lyricist": "[lyricist] 作词人:",
    "meta_lyricist_placeholder": "作词人姓名",
    "meta_translator": "[translator] 翻译者:",
    "meta_translator_placeholder": "翻译者姓名",
    "meta_language": "[language] 歌词语言:",
    "meta_language_placeholder": "语言名称",
    
    // 浮动按钮
    "toggle_theme": "切换主题",
    "github_project": "GitHub项目",
    
    // 消息提示
    "message_title": "提示",
    "leave_confirm": "您正在编辑歌词，确定要离开吗？",
    
    // 按键操作提示
    "key_open_file": "已触发文件选择对话框",
    "key_play_pause": "播放/暂停切换",
    "key_back_2s": "后退2秒",
    "key_forward_2s": "前进2秒",
    "key_prev_lyric": "已切换到上一句歌词",
    "key_next_lyric": "已切换到下一句歌词",
    "key_mark_time": "已标记当前时间点",
    
    // 语言选择
    "language": "语言",
    "lang_zh_cn": "简体中文",
    "lang_zh_tw": "繁体中文",
    "lang_en": "English"
};