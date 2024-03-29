/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { services } from '@architect/functions'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import memoizee from 'memoizee'

async function getServiceProps() {
  const discoveredServices = await services()
  return discoveredServices['nasa_gcn-architect_plugin_search']
}

/** Return the OpenSearch Service name. */
export async function name(): Promise<string | undefined> {
  const props = await getServiceProps()
  return props.name
}

export const search = memoizee(
  async () => {
    const props = await getServiceProps()
    const node = props?.node
    const service = props?.sig4service
    if (!node) throw new Error('unknown endpoint')

    const options = { node }

    if (service) {
      const region = process.env.AWS_REGION
      if (!region)
        throw new Error('environment variable AWS_REGION must be defined')
      Object.assign(
        options,
        AwsSigv4Signer({
          region,
          service,
        })
      )
    }

    return new Client(options)
  },
  { promise: true }
)
