/**
 * English language pack
 */
const en_US = {
    // Page title
    "title": "EasyLRC",
    "subtitle": "Create synchronized lyrics easily, supporting line-by-line and character-by-character modes",
    
    // Lyric Context
    noLyric: 'N/A',

    // Confirmation Dialog
    confirmOperationTitle: 'Confirm Operation',
    confirmOperationMessage: 'Are you sure you want to perform this action?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',

    // Prompt Dialog
    promptInputTitle: 'Please Enter',
    timeInputLabel: 'Time (min:sec.hundredths):',
    translationInputLabel: 'Translation:',
    lyricContentLabel: 'Lyric Content:',
    tipTitle: 'Tip',
    uploadAudioAndTagLyrics: 'Please upload audio and complete lyric time tagging first',
    noLyricData: 'No lyric data',
    noValidTimedLyrics: 'No valid timed lyrics found',

    // Metadata
    metaArtist: 'Artist',
    metaTitle: 'Song Title',
    metaAlbum: 'Album',
    metaLyricCreator: 'Lyric Creator/Editor',
    metaOffset: 'Time Offset',
    metaLength: 'Song Length',
    metaSinger: 'Singer',
    metaArranger: 'Arranger',
    metaVersion: 'Version Info',
    metaComposer: 'Composer',
    metaLyricist: 'Lyricist',
    metaTranslator: 'Translator',
    metaLanguage: 'Lyric Language',

    // Lyric Edit/Delete/Jump
    editLyricTitle: 'Edit Lyric',
    editLyricMessage: 'Please edit the lyric content:',
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteMessage: 'Are you sure you want to delete this lyric?',
    operationSuccessTitle: 'Operation Successful',
    lyricDeletedMessage: 'Lyric deleted',
    jumpToLyric: 'Jumped to lyric {index}',
    
    // Bilingual lyrics
    bilingual_enabled_title: 'Bilingual Lyrics Enabled',
    bilingual_enabled_message: 'Text Input: Odd lines are lyrics, even lines are translations\nLRC Import: Content after "/" will be recognized as translation',

    // File Detection
    audioFileDetected: 'Detected {count} audio files, only loading the first one',
    lyricFileDetected: 'Detected {count} lyric files, only loading the first one',

    // Audio file area
    "audio_file": "Audio File",
    "lyricInputTitle": "Lyric Input",
    "upload_audio": "Upload Audio File",
    
    // Lyric input area
    "lyric_input": "Lyric Input",
    "text_input": "Text Input",
    "import_lrc": "Import LRC",
    "enable_bilingual": "Enable Bilingual Lyrics",
    "bilingual_tooltip": "When enabled: Text input will use odd lines as lyrics and even lines as translations; When importing LRC, content after "/" or in double-line format will be recognized as translations",
    "lyric_textarea_placeholder": "Enter lyrics here, they will be automatically split by line break, commas, and periods...\nWhen bilingual lyrics are enabled: odd lines are lyrics, even lines are translations (empty lines allowed)",
    "split_lyric": "Split Lyrics",
    "upload_lrc": "Upload LRC File",
    
    // Timing control area
    "timing_controls": "Timing Controls",
    "process_mode": "Processing Mode",
    "line_mode": "Line-by-Line",
    "char_mode": "Character-by-Character",
    "reset": "Reset",
    "prev_lyric": "Previous",
    "next_lyric": "Next",
    "prev_lyric_text": "Previous Lyric: ",
    "current_lyric_text": "Current Processing: ",
    "next_lyric_text": "Next Lyric: ",
    "none": "None",
    "back_2s": "Back 2s",
    "forward_2s": "Forward 2s",
    "play_pause": "Play/Pause",
    "mark_time": "Mark Time",
    
    // Lyric preview area
    "lyric_preview": "Lyric Preview",
    "lyric_preview_placeholder": "Please enter lyrics and split them, or import an LRC file",
    "add_blank_lyric": "Add Blank Lyric",
    
    // Time adjustment area
    "time_adjustment": "Time Adjustment",
    "adjustment_desc": "Adjust all timestamps (seconds.milliseconds, e.g.: 0.500 or -0.200)",
    "adjustment_placeholder": "Enter adjustment value",
    "apply_adjustment": "Apply Adjustment",
    "next_step": "Next Step: Preview Sync Effect",
    
    // Preview interface
    "sync_preview": "Lyric Sync Preview",
    "sync_preview_placeholder": "Play audio to start previewing lyric synchronization effect",
    "back_to_edit": "Previous Step: Return to Edit",
    "export_lrc": "Export LRC File",
    
    // Metadata area
    "lyric_metadata": "Lyric Metadata",
    "meta_ar": "[ar] Artist:",
    "meta_ar_placeholder": "Artist name",
    "meta_ti": "[ti] Title:",
    "meta_ti_placeholder": "Song title",
    "meta_al": "[al] Album:",
    "meta_al_placeholder": "Album name",
    "meta_by": "[by] Creator/Editor:",
    "meta_by_placeholder": "Creator name",
    "meta_offset": "[offset] Time Offset (ms):",
    "meta_offset_placeholder": "0",
    "meta_length": "[length] Total Duration:",
    "meta_length_placeholder": "00:00.00",
    "meta_au": "[au] Singer:",
    "meta_au_placeholder": "Singer name",
    "meta_re": "[re] Arranger:",
    "meta_re_placeholder": "Arranger name",
    "meta_ve": "[ve] Version Info:",
    "meta_ve_placeholder": "Version number or description",
    "meta_composer": "[composer] Composer:",
    "meta_composer_placeholder": "Composer name",
    "meta_lyricist": "[lyricist] Lyricist:",
    "meta_lyricist_placeholder": "Lyricist name",
    "meta_translator": "[translator] Translator:",
    "meta_translator_placeholder": "Translator name",
    "meta_language": "[language] Lyric Language:",
    "meta_language_placeholder": "Language name",
    
    // Floating buttons
    "toggle_theme": "Toggle Theme",
    "github_project": "GitHub Project",
    
    // Message prompts
    "message_title": "Notice",
    "leave_confirm": "You are editing lyrics. Are you sure you want to leave?",
    
    // Key operation prompts
    "key_open_file": "File selection dialog triggered",
    "key_play_pause": "Play/Pause toggled",
    "key_back_2s": "Moved back 2 seconds",
    "key_forward_2s": "Moved forward 2 seconds",
    "key_prev_lyric": "Switched to previous lyric",
    "key_next_lyric": "Switched to next lyric",
    "key_mark_time": "Current time point marked",
    
    // Language selection
    "language": "Language",
    "lang_zh_cn": "简体中文",
    "lang_zh_tw": "繁體中文",
    "lang_en": "English"
};