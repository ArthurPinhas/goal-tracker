import { useEffect } from 'react';
import { useGoalEmojiSuggest } from '@/hooks/useGoalEmojiSuggest';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shuffle, Smile, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMOJI_PICKER_GRID } from '@/lib/goalEmojiSuggest';

const PICKER_EMOJIS = EMOJI_PICKER_GRID.slice(0, 45);

interface GoalEmojiTitleSectionProps {
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  onTitleChange: (v: string) => void;
  initialEmoji: string | null;
  /** Keeps parent form in sync for submit */
  onEmojiChange?: (emoji: string | null) => void;
  titleInputId: string;
  titleLabel: string;
  placeholder?: string;
}

const GoalEmojiTitleSection = ({
  open,
  mode,
  title,
  onTitleChange,
  initialEmoji,
  titleInputId,
  titleLabel,
  placeholder,
  onEmojiChange,
}: GoalEmojiTitleSectionProps) => {
  const {
    suggestedEmoji,
    displayEmoji,
    selectedEmoji,
    showApply,
    applySuggested,
    shuffle,
    clearEmoji,
    pickEmoji,
  } = useGoalEmojiSuggest({ open, mode, title, initialEmoji });

  useEffect(() => {
    onEmojiChange?.(selectedEmoji);
  }, [selectedEmoji, onEmojiChange]);

  const showTile = !!displayEmoji;
  const canClear = !!selectedEmoji;

  return (
    <div className="space-y-2">
      <Label htmlFor={titleInputId} className="ui-section-label">
        {titleLabel}
      </Label>
      <div
        className={cn('flex items-start', showTile && 'gap-2')}
      >
        {showTile && (
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-muted/50 shadow-sm dark:bg-card/50 dark:border-border/60 dark:shadow-md dark:shadow-black/35"
            title="Goal emoji"
          >
            <motion.span
              key={displayEmoji}
              initial={{ scale: 0.88, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 32 }}
              className="select-none text-2xl leading-none"
              aria-hidden
            >
              {displayEmoji}
            </motion.span>
          </div>
        )}
        <Input
          id={titleInputId}
          placeholder={placeholder}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-11 min-w-0 flex-1 app-surface-input rounded-lg transition-shadow duration-300"
          autoFocus={mode === 'create'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {showApply && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={applySuggested}
            aria-label="Use suggested emoji"
          >
            <span className="text-base leading-none" aria-hidden>
              {suggestedEmoji}
            </span>
            <span>Apply</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={shuffle}
          title="Another emoji"
        >
          <Shuffle className="h-3 w-3" />
          Shuffle
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Smile className="h-3 w-3" />
              Pick
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-2 dark:border-border/55 dark:bg-card dark:shadow-2xl dark:shadow-black/40" align="start">
            <div className="grid grid-cols-5 gap-1">
              {PICKER_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="h-9 rounded-lg text-xl transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95"
                  onClick={() => pickEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {canClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={clearEmoji}
          >
            <Ban className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoalEmojiTitleSection;
