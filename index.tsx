import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { findByProps, findComponentByCodeLazy } from "@webpack";

const Button = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");
let enabled = false;

function refresh_voice_state(enabled: boolean) {
    const ChannelStore = findByProps("getChannel", "getDMFromUserId");
    const SelectedChannelStore = findByProps("getVoiceChannelId");
    const GatewayConnection = findByProps("voiceStateUpdate");
    const MediaEngineStore = findByProps("isDeaf", "isMute");
    
    if (!GatewayConnection || !SelectedChannelStore) {
        console.log("[FakeDeafen] GatewayConnection or SelectedChannelStore not found");
        return;
    }

    const channelId = SelectedChannelStore.getVoiceChannelId();
    const channel = channelId ? ChannelStore?.getChannel(channelId) : null;
    
    if (channel) {
        try {
            GatewayConnection.voiceStateUpdate({
                channelId: channel.id,
                guildId: channel.guild_id,
                selfMute: enabled || (MediaEngineStore?.isMute() ?? false),
                selfDeaf: enabled || (MediaEngineStore?.isDeaf() ?? false)
            });
        } catch (error) {
            console.error("[FakeDeafen] failed to update voice state:", error);
        }
    }
}

function fd_icon() {
    const iconColor = enabled ? "#ed4245" : "currentColor";
    
    return (
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="8" width="20" height="4" rx="2" fill={iconColor}/>
            <rect x="11" y="3" width="10" height="8" rx="3" fill={iconColor}/>
            {enabled ? (
                <>
                    <line x1="7" y1="18" x2="13" y2="24" stroke={iconColor} strokeWidth="2"/>
                    <line x1="13" y1="18" x2="7" y2="24" stroke={iconColor} strokeWidth="2"/>
                    <line x1="19" y1="18" x2="25" y2="24" stroke={iconColor} strokeWidth="2"/>
                    <line x1="25" y1="18" x2="19" y2="24" stroke={iconColor} strokeWidth="2"/>
                    <path d="M14 23c1-1 3-1 4 0" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/>
                </>
            ) : (
                <>
                    <circle cx="10" cy="21" r="4" stroke={iconColor} strokeWidth="2" fill="none"/>
                    <circle cx="22" cy="21" r="4" stroke={iconColor} strokeWidth="2" fill="none"/>
                    <path d="M14 21c1 1 3 1 4 0" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/>
                </>
            )}
        </svg>
    );
}

function fd_button(props: { nameplate?: any; }) {
    return (
        <Button
            tooltipText={enabled ? "Disable Fake Deafen" : "Enable Fake Deafen"}
            icon={fd_icon}
            role="switch"
            aria-checked={enabled}
            redGlow={enabled}
            plated={props?.nameplate != null}
            onClick={() => {
                enabled = !enabled;
                refresh_voice_state(enabled);
            }}
        />
    );
}

let originalVoiceStateUpdate: any;

export default definePlugin({
    name: "FakeDeafen",
    description: "Fake deafen yourself",
    authors: [{ name: "hyyven", id: 449282863582412850n }],

    start() {
        const GatewayConnection = findByProps("voiceStateUpdate");
        if (!GatewayConnection) return;
        
        originalVoiceStateUpdate = GatewayConnection.voiceStateUpdate;
        GatewayConnection.voiceStateUpdate = function (args: any) {
            if (enabled && args) {
                args.selfMute = true;
                args.selfDeaf = true;
            }
            return originalVoiceStateUpdate.apply(this, arguments);
        };
    },

    stop() {
        const GatewayConnection = findByProps("voiceStateUpdate");
        if (GatewayConnection && originalVoiceStateUpdate) {
            GatewayConnection.voiceStateUpdate = originalVoiceStateUpdate;
        }
    },

    patches: [
        {
            find: ".DISPLAY_NAME_STYLES_COACHMARK)",
            replacement: {
                match: /children:\[(?=.{0,25}?accountContainerRef)/,
                replace: "children:[$self.fd_button(arguments[0]),"
            }
        }
    ],

    fd_button: ErrorBoundary.wrap(fd_button, { noop: true }),
});