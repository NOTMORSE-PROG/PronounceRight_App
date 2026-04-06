// Static require() map — Metro bundler requires literal paths, no dynamic construction.
const VIDEO_REGISTRY: Record<string, number> = {
  's1-opening':          require('./s1-opening.mp4'),
  's1-followup-yes':     require('./s1-followup-yes.mp4'),
  's1-followup-no':      require('./s1-followup-no.mp4'),
  's1-final-yes':        require('./s1-final-yes.mp4'),
  's1-final-no':         require('./s1-final-no.mp4'),
  's2-opening':          require('./s2-opening.mp4'),
  's2-followup-1':       require('./s2-followup-1.mp4'),
  's2-followup-2':       require('./s2-followup-2.mp4'),
  's2-final':            require('./s2-final.mp4'),
  's3-opening':          require('./s3-opening.mp4'),
  's3-followup-positive': require('./s3-followup-positive.mp4'),
  's3-followup-negative': require('./s3-followup-negative.mp4'),
  's3-final-positive':   require('./s3-final-positive.mp4'),
  's3-final-negative':   require('./s3-final-negative.mp4'),
  's4-opening':          require('./s4-opening.mp4'),
  's4-followup-yes':     require('./s4-followup-yes.mp4'),
  's4-followup-no':      require('./s4-followup-no.mp4'),
  's4-final-yes':        require('./s4-final-yes.mp4'),
  's4-final-no':         require('./s4-final-no.mp4'),
  's5-opening':          require('./s5-opening.mp4'),
  's5-followup':         require('./s5-followup.mp4'),
  's5-general':          require('./s5-general.mp4'),
};

export default VIDEO_REGISTRY;
