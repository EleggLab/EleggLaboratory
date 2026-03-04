# Interaction Motion Spec v1

## Merge Hold
- Trigger: dragged element overlaps valid target
- Duration: 2.0s
- Visual: progress ring drawn on dragged element
- Commit: on drop after hold complete

## Invalid Target
- Trigger: dragged element overlaps non-combinable target
- Visual: subtle red X badge near dragged element
- No shake spam, no hard block

## Trash Hold Delete
- Trigger: dragged element inside trash area
- Duration: 2.0s
- Visual: trash progress ring
- Commit: delete on drop after hold complete
