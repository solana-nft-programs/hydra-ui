import { FanoutClient } from '@glasseaters/hydra-sdk'
import { firstParam } from 'common/utils'
import { useRouter } from 'next/router'
import { useDataHook } from './useDataHook'

export const useFanoutId = () => {
  const { query } = useRouter()
  return useDataHook(
    async () => (await FanoutClient.fanoutKey(firstParam(query.id)))[0],
    [query],
    { name: 'useFanoutId' }
  )
}
