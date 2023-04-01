import { gql } from '@urql/core';

export const FarmsQuery = gql`
  query getFarms($chain: String!, $protocol: String!) {
    farms(chain: $chain, protocol: $protocol) {
      id
      chef
      chain
      protocol
      farmType
      farmImpl
      asset {
        symbol
        address
        price
        logos
      }
      tvl
      rewards {
        amount
        asset
        valueUSD
        freq
      }
      apr {
        reward
        base
      }
      allocPoint
      lastUpdatedAtUTC
      safetyScore
    }
  }
`;

// XCMP TASKS QUERY/MUTATION

export const XcmpTasksQuery = gql`
  query getXcmpTasks($userAddress: String!, $chain: XCMPTaskChain!) {
    xcmpTasks(userAddress: $userAddress, chain: $chain) {
      taskId
      userAddress
      lpName
      chain
      status
    }
  }
`;

export const AddXcmpTaskMutation = gql`
  mutation addXcmpTask(
    $taskId: String!
    $userAddress: String!
    $lpName: String!
    $chain: XCMPTaskChain!
  ) {
    addTask(
      taskId: $taskId
      userAddress: $userAddress
      lpName: $lpName
      chain: $chain
    ) {
      taskId
      userAddress
      lpName
      chain
      status
    }
  }
`;

export const UpdateXcmpTaskMutation = gql`
  mutation updateXcmpTask(
    $taskId: String!
    $userAddress: String!
    $lpName: String!
    $chain: XCMPTaskChain!
    $newStatus: String!
  ) {
    updateTaskStatus(
      taskId: $taskId
      userAddress: $userAddress
      lpName: $lpName
      chain: $chain
      newStatus: $newStatus
    )
  }
`;

// LIQUIDITY AND COMPOUNDING EVENT MUTATIONS

export const createLiquidityEventMutation = gql`
  mutation createLiquidity(
    $userAddress: String!
    $chain: XCMPTaskChain!
    $token0: TokenInput!
    $token1: TokenInput!
    $lp: TokenInput!
    $timestamp: String!
    $gasFee: Float! # in MGX
    $eventType: LiquidityEventType!
  ) {
    createLiquidityEvent(
      userAddress: $userAddress
      chain: $chain
      token0: $token0
      token1: $token1
      lp: $lp
      timestamp: $timestamp
      gasFee: $gasFee # in MGX
      eventType: $eventType
    ) {
      userAddress
      chain
      token0 {
        symbol
        amount
      }
      token1 {
        symbol
        amount
      }
      lp {
        symbol
        amount
      }
      timestamp
      gasFee
      eventType
    }
  }
`;

export const autocompoundEventsQuery = gql`
  query getAutocompoundEvents($userAddress: String!, $chain: XCMPTaskChain!) {
    autocompoundEvents(userAddress: $userAddress, chain: $chain) {
      userAddress
      chain
      # taskId
      lp {
        symbol
        amount
      }
      duration
      frequency
      timestamp
      executionFee
      xcmpFee
      status
      eventType
    }
  }
`;

export const createAutocompoundEventMutation = gql`
  mutation createAutocompound(
    $userAddress: String!
    $chain: XCMPTaskChain!
    $taskId: String!
    $lp: TokenInput!
    $duration: Int! # in days
    $frequency: Int! # in days
    $timestamp: String!
    $executionFee: Float! # in TUR
    $xcmpFee: Float! # in TUR
    $status: XCMPTaskStatus!
    $eventType: AutocompoundEventType!
  ) {
    createAutocompoundEvent(
      userAddress: $userAddress
      chain: $chain
      taskId: $taskId
      lp: $lp
      duration: $duration
      frequency: $frequency
      timestamp: $timestamp
      executionFee: $executionFee
      xcmpFee: $xcmpFee
      status: $status
      eventType: $eventType
    ) {
      userAddress
      chain
      # taskId
      lp {
        symbol
        amount
      }
      duration
      frequency
      timestamp
      executionFee
      xcmpFee
      status
      eventType
    }
  }
`;

export const updateAutocompoundEventStatusMutation = gql`
  mutation updateAutocompound(
    $userAddress: String!
    $chain: XCMPTaskChain!
    $taskId: String!
    $lp: TokenInput!
    $newStatus: String!
  ) {
    updateAutocompoundEventStatus(
      userAddress: $userAddress
      chain: $chain
      taskId: $taskId
      lp: $lp
      newStatus: $newStatus
    )
  }
`;
