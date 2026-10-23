// The thumbnail registry: lessons.json and the catalogues reference a template
// by id. Keep the 'ID': Component literal form — the validators scrape it.
import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';
import { TwoKeysFocus, RhythmLoopCover, PrecisionTargetCover, CourseFoundationsCover, SectionKeysShowcase } from './covers/typing';
import { LetterStageCover, CodesStageCover, PhonemeStageCover, GraphemeStageCover } from './covers/english';
import { GradeCover, SubjectCover, CodeTrackCover, BookCover, ExamCover } from './covers/catalog';
import { NinjaArenaCover, MinionBossCover } from './covers/games/ninja';
import { RhinoDashCover } from './covers/games/rhinoDash';
import { SkyHopCover } from './covers/games/skyHop';
import { BeamBreakCover } from './covers/games/beamBreak';
import { TugOfTypingCover } from './covers/games/tugOfTyping';
import { AlienDropCover } from './covers/games/alienDrop';
import { StarTypeCover } from './covers/games/starType';
import { WordForgeCover } from './covers/games/wordForge';

export const ThumbnailRegistry: Record<string, React.FC<SvgTemplateProps>> = {
  'EXAM_COVER': ExamCover,
  'GRADE_COVER': GradeCover,
  'SUBJECT_COVER': SubjectCover,
  'CODE_TRACK_COVER': CodeTrackCover,
  'BOOK_COVER': BookCover,
  'WORD_FORGE_COVER': WordForgeCover,
  'STAR_TYPE_COVER': StarTypeCover,
  'ALIEN_DROP_COVER': AlienDropCover,
  'SKY_HOP_COVER': SkyHopCover,
  'TUG_OF_TYPING_COVER': TugOfTypingCover,
  'BEAM_BREAK_COVER': BeamBreakCover,
  'LETTER_STAGE': LetterStageCover,
  'CODES_STAGE': CodesStageCover,
  'PHONEME_STAGE': PhonemeStageCover,
  'GRAPHEME_STAGE': GraphemeStageCover,
  'TWO_KEYS_FOCUS': TwoKeysFocus,
  'RHYTHM_LOOP': RhythmLoopCover,
  'PRECISION_TARGET': PrecisionTargetCover,
  'NINJA_ARENA_COVER': NinjaArenaCover,
  'RHINO_DASH_COVER': RhinoDashCover,
  'MINION_BOSS_COVER': MinionBossCover,
  'COURSE_FOUNDATIONS_COVER': CourseFoundationsCover,
  'SECTION_KEYS_SHOWCASE': SectionKeysShowcase,
};
