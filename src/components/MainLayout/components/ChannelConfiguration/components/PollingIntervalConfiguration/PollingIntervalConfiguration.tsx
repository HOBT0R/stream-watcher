import { Typography, Slider, Box } from '@mui/material';
import { useChannels } from '../../../../../../contexts/ChannelContext';
import { MIN_POLLING_INTERVAL, MAX_POLLING_INTERVAL } from '../../../../../../constants/config';

const PollingIntervalConfiguration = () => {
    const { pollingInterval, setPollingInterval } = useChannels();

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        setPollingInterval(newValue as number);
    };

    const valueLabelFormat = (value: number) => {
        if (value < 60) {
            return `${value}s`;
        }
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        if (seconds === 0) {
            return `${minutes}m`;
        }
        return `${minutes}m ${seconds}s`;
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography gutterBottom>
                Polling Interval
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Set how often to check for stream status updates. Shorter intervals mean quicker updates but higher resource usage.
            </Typography>
            <Slider
                value={pollingInterval}
                onChange={handleSliderChange}
                aria-labelledby="polling-interval-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={valueLabelFormat}
                step={15}
                marks={[
                    { value: MIN_POLLING_INTERVAL, label: '30s' },
                    { value: 90, label: '90s' },
                    { value: 300, label: '5m' },
                    { value: 600, label: '10m' },
                    { value: MAX_POLLING_INTERVAL, label: '15m' },
                ]}
                min={MIN_POLLING_INTERVAL}
                max={MAX_POLLING_INTERVAL}
            />
        </Box>
    );
};

export default PollingIntervalConfiguration; 