import Big from 'big.js';

export enum SwapDirection {
    IN = 'Loop In',
    OUT = 'Loop Out'
}

export interface Quote {
    swapFee: Big;
    minerFee: Big;
    prepayAmount: Big;
}

export interface SwapTerms {
    in: {
        min: Big;
        max: Big;
    };
    out: {
        min: Big;
        max: Big;
        minCltv?: number;
        maxCltv?: number;
    };
}

export enum BuildSwapSteps {
    Closed = 0,
    SelectDirection = 1,
    ChooseAmount = 2,
    ReviewQuote = 3,
    Processing = 4
}

export enum SidecarRegisterSteps {
    Closed = 0,
    EnterTicket = 1,
    ConfirmTicket = 2,
    Processing = 3,
    Complete = 4
}

export interface Alert {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'default';
    title?: string;
    message: string;
    /** the number of milliseconds before the toast closes automatically */
    ms?: number;
}

export interface SortParams<T> {
    field?: keyof T;
    descending: boolean;
}

export enum ChannelStatus {
    UNKNOWN = 'Unknown',
    OPEN = 'Open',
    OPENING = 'Opening',
    CLOSING = 'Closing',
    FORCE_CLOSING = 'Force Closing',
    WAITING_TO_CLOSE = 'Waiting To Close'
}

/**
 * A type to signify that a number actually represents a lease duration.
 * This just makes the code more readable since it will be clear that a
 * duration is not just a random number.
 */
export type LeaseDuration = number;

/**
 * A type to signify that a string represents a node pubkey
 */
export type PubKey = string;

export interface CommonInsightsData {
    alias: string;
    totalCapacity: number;
    agedCapacity: number;
    centrality: number;
    centralityNormalized: number;
    maxChannelAge: number;
    totalPeers: number;
    addresses: string[];
}

export interface UnstableNodeData extends CommonInsightsData {
    failMinChanCount?: boolean;
    failMinMedianCapacity?: boolean;
    failMaxDisableRatio?: boolean;
    failUptimeRatio?: boolean;
}

export interface StableNodeData extends CommonInsightsData {
    stableInboundPeers: PubKey[];
    stableOutboundPeers: PubKey[];
    goodInboundPeers: PubKey[];
    goodOutboundPeers: PubKey[];
}

export interface ScoredNodeData extends StableNodeData {
    score: number;
}

export interface NodeInsightsData {
    lastUpdated: string;
    maxScore: number;
    maxGoodOutboundPeers: number;
    numScored: number;
    numStable: number;
    numUnstable: number;
    numNonConnectable: number;
    heuristics: {
        maximumDisableRatio: number;
        minimumActiveChannelCount: number;
        minimumStableOutboundPeers: number;
        minimumChannelAgeBlocksCount: number;
        minimumMedianCapacity: number;
        minimumRoutableTokens: number;
        uptimePercentage: number;
    };
    scored: Record<PubKey, ScoredNodeData>;
    stable: Record<PubKey, StableNodeData>;
    unstable: Record<PubKey, UnstableNodeData>;
    unconnectable: PubKey[];
}

export enum NodeHealth {
    Unconnectable,
    Online,
    PlentyOfChannels,
    GoodRoutingCapacity,
    HealthyChannels,
    Stable,
    Scored
}

export interface HealthCheck {
    minNodeHealth: number;
    description: string;
    guide: {
        title: string;
        url: string;
    };
}
