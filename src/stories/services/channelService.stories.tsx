import { useEffect, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { channelService, Channel, AuthRequiredError } from '../../services/api/channelService';

const ChannelStatusesTester = ({ channelNames }: { channelNames: string[] }) => {
    const [statuses, setStatuses] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchStatuses = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await channelService.getChannelStatuses(channelNames);
                setStatuses(result);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatuses();
    }, [channelNames]);

    if (loading) return <div>Loading statuses...</div>;
    if (error) return <div>Error fetching statuses: {error.message}</div>;

    return (
        <div>
            <h3>Channel Statuses</h3>
            <ul>
                {statuses.map(s => (
                    <li key={s.channelName}>
                        <strong>{s.channelName}:</strong> {s.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const StreamKeyTester = ({ channelName }: { channelName: string }) => {
    const [streamKey, setStreamKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AuthRequiredError | Error | null>(null);

    useEffect(() => {
        const fetchStreamKey = async () => {
            setLoading(true);
            setError(null);
            setStreamKey(null);
            try {
                const result = await channelService.getStreamKey(channelName);
                setStreamKey(result.streamKey);
            } catch (e) {
                setError(e as AuthRequiredError | Error);
            } finally {
                setLoading(false);
            }
        };

        fetchStreamKey();
    }, [channelName]);

    if (loading) return <div>Loading stream key...</div>;
    
    if (error) {
        if ('authUrl' in error) {
            return <div>
                <h3>Authentication Required</h3>
                <p>Redirecting to: <a href={(error as AuthRequiredError).authUrl} target="_blank" rel="noopener noreferrer">{(error as AuthRequiredError).authUrl}</a></p>
            </div>;
        }
        return <div>Error fetching stream key: {error.message}</div>;
    }

    return (
        <div>
            <h3>Stream Key</h3>
            <p>Stream key for <strong>{channelName}</strong>: {streamKey}</p>
        </div>
    );
};

const meta: Meta = {
    title: 'Services/ChannelService',
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj;

export const GetChannelStatusesSuccess: Story = {
    render: () => <ChannelStatusesTester channelNames={['shroud', 'summit1g']} />,
    parameters: {
        msw: {
            handlers: [
                http.post('http://localhost:3000/api/v1/statuses', () => {
                    return HttpResponse.json({
                        channels: [
                            { channelName: 'shroud', status: 'online' },
                            { channelName: 'summit1g', status: 'offline' },
                        ]
                    });
                })
            ]
        }
    }
};

export const GetStreamKeySuccess: Story = {
    render: () => <StreamKeyTester channelName="test_channel" />,
    parameters: {
        msw: {
            handlers: [
                http.get('http://localhost:3000/api/v1/getStreamKey', () => {
                    return HttpResponse.json('fake_stream_key_12345');
                })
            ]
        }
    }
};

export const GetStreamKeyAuthRequired: Story = {
    render: () => <StreamKeyTester channelName="auth_required_channel" />,
    parameters: {
        msw: {
            handlers: [
                http.get('http://localhost:3000/api/v1/getStreamKey', () => {
                    return new HttpResponse('https://id.twitch.tv/oauth2/authorize?client_id=...', {
                        status: 302,
                    });
                })
            ]
        }
    }
};

export const ApiError: Story = {
    render: () => <ChannelStatusesTester channelNames={['error_channel']} />,
    parameters: {
        msw: {
            handlers: [
                http.post('http://localhost:3000/api/v1/statuses', () => {
                    return new HttpResponse(null, {
                        status: 500,
                        statusText: 'Internal Server Error',
                    });
                })
            ]
        }
    }
}; 