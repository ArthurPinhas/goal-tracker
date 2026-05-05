import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getSuggestionForTitle,
  EMOJI_SHUFFLE_POOL,
} from '@/lib/goalEmojiSuggest';
import { playEmojiSpark, playRemove } from '@/lib/sounds';

const DEBOUNCE_MS = 260;

export function useGoalEmojiSuggest(opts: {
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  initialEmoji: string | null;
}) {
  const { open, mode, title, initialEmoji } = opts;

  const [debouncedTitle, setDebouncedTitle] = useState(title);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  /** After Clear: hide title-based preview until title changes */
  const [previewDismissed, setPreviewDismissed] = useState(false);

  const prevOpen = useRef(false);
  /**
   * True after user uses Shuffle or Pick (not after auto title sync).
   * While set, we keep their emoji until the debounced **title text** changes; then we may adopt a new suggestion.
   */
  const manualEmojiLockRef = useRef(false);
  const prevDebouncedTitleRef = useRef('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(title), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [title]);

  const { primary: suggestedEmoji } = useMemo(
    () => getSuggestionForTitle(debouncedTitle),
    [debouncedTitle]
  );

  useEffect(() => {
    setPreviewDismissed(false);
  }, [debouncedTitle]);

  useEffect(() => {
    const opened = open && !prevOpen.current;
    prevOpen.current = open;
    if (!opened) return;

    setPreviewDismissed(false);
    manualEmojiLockRef.current = false;
    if (mode === 'create') {
      setSelectedEmoji(null);
      setLocked(false);
    } else {
      setSelectedEmoji(initialEmoji);
      setLocked(true);
    }
    setDebouncedTitle(title);
    prevDebouncedTitleRef.current = title;
  }, [open, mode, initialEmoji, title]);

  /** After Shuffle/Pick: when the user edits the title, follow keyword suggestions again. */
  useEffect(() => {
    if (!open) return;
    if (!locked || !manualEmojiLockRef.current) {
      prevDebouncedTitleRef.current = debouncedTitle;
      return;
    }

    const titleChanged = debouncedTitle !== prevDebouncedTitleRef.current;
    prevDebouncedTitleRef.current = debouncedTitle;
    if (!titleChanged) return;

    if (!debouncedTitle.trim()) return;
    if (suggestedEmoji == null) return;
    if (suggestedEmoji === selectedEmoji) return;

    setSelectedEmoji(suggestedEmoji);
    setLocked(false);
    manualEmojiLockRef.current = false;
  }, [open, locked, debouncedTitle, suggestedEmoji, selectedEmoji]);

  useEffect(() => {
    if (!open || locked) return;
    const t = debouncedTitle.trim();
    if (!t) {
      setSelectedEmoji(null);
      return;
    }
    setSelectedEmoji(suggestedEmoji);
  }, [open, locked, suggestedEmoji, debouncedTitle]);

  const displayEmoji = useMemo(() => {
    if (previewDismissed) return selectedEmoji;
    return selectedEmoji ?? suggestedEmoji ?? null;
  }, [previewDismissed, selectedEmoji, suggestedEmoji]);

  const applySuggested = useCallback(() => {
    setSelectedEmoji(suggestedEmoji);
    setLocked(false);
    setPreviewDismissed(false);
    manualEmojiLockRef.current = false;
    playEmojiSpark();
  }, [suggestedEmoji]);

  const shuffle = useCallback(() => {
    const current = displayEmoji;
    const withoutCurrent = EMOJI_SHUFFLE_POOL.filter((e) => e !== current);
    const bag = withoutCurrent.length > 0 ? withoutCurrent : [...EMOJI_SHUFFLE_POOL];
    const pick = bag[Math.floor(Math.random() * bag.length)]!;
    setSelectedEmoji(pick);
    setLocked(true);
    manualEmojiLockRef.current = true;
    setPreviewDismissed(false);
    playEmojiSpark();
  }, [displayEmoji]);

  const clearEmoji = useCallback(() => {
    setSelectedEmoji(null);
    setLocked(true);
    manualEmojiLockRef.current = false;
    setPreviewDismissed(true);
    playRemove();
  }, []);

  const pickEmoji = useCallback((e: string) => {
    setSelectedEmoji(e);
    setLocked(true);
    manualEmojiLockRef.current = true;
    setPreviewDismissed(false);
    playEmojiSpark();
  }, []);

  /** Edit only: offer applying title-based emoji when it differs from what is saved */
  const showApply =
    mode === 'edit' && suggestedEmoji != null && selectedEmoji !== suggestedEmoji;

  return {
    suggestedEmoji,
    selectedEmoji,
    displayEmoji,
    applySuggested,
    showApply,
    shuffle,
    clearEmoji,
    pickEmoji,
  };
}
