import { Tooltip, IconButton } from '@mui/material';
import { PlayArrow as PlayArrowIcon, Stop as StopIcon } from '@mui/icons-material';

export const PlayButton = ({ isPlaying, onClick, disabled }: { isPlaying: boolean, onClick: () => void, disabled: boolean }) => (
    <Tooltip title={isPlaying ? "Stop Stream" : "Play Stream"}>
        <span>
            <IconButton 
                size="small" 
                onClick={onClick} 
                disabled={disabled}
                data-testid={isPlaying ? 'stop-button' : 'play-button'}
                aria-label={isPlaying ? "Stop Stream" : "Play Stream"}
            >
                {isPlaying ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
        </span>
    </Tooltip>
); 