import React from 'react'
import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, native, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Button, ButtonText} from '#/components/Button'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Divider} from '#/components/Divider'
import {Link} from '#/components/Link'
import {makeSearchLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {
  usePreferencesQuery,
  useUpsertMutedWordsMutation,
  useRemoveMutedWordMutation,
} from '#/state/queries/preferences'
import {Loader} from '#/components/Loader'
import {isInvalidHandle} from '#/lib/strings/handles'

export function useTagMenuControl() {
  return Dialog.useDialogControl()
}

export function TagMenu({
  children,
  control,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  /**
   * This should be the sanitized tag value from the facet itself, not the
   * "display" value with a leading `#`.
   */
  tag: string
  authorHandle?: string
}>) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {isLoading: isPreferencesLoading, data: preferences} =
    usePreferencesQuery()
  const {
    mutateAsync: upsertMutedWord,
    variables: optimisticUpsert,
    reset: resetUpsert,
  } = useUpsertMutedWordsMutation()
  const {
    mutateAsync: removeMutedWord,
    variables: optimisticRemove,
    reset: resetRemove,
  } = useRemoveMutedWordMutation()
  const displayTag = '#' + tag

  const isMuted = Boolean(
    (preferences?.mutedWords?.find(
      m => m.value === tag && m.targets.includes('tag'),
    ) ??
      optimisticUpsert?.find(
        m => m.value === tag && m.targets.includes('tag'),
      )) &&
      !(optimisticRemove?.value === tag),
  )

  return (
    <>
      {children}

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner label={_(msg`Tag menu: ${displayTag}`)}>
          {isPreferencesLoading ? (
            <View style={[a.w_full, a.align_center]}>
              <Loader size="lg" />
            </View>
          ) : (
            <>
              <View
                style={[
                  a.rounded_md,
                  a.border,
                  a.mb_md,
                  t.atoms.border_contrast_low,
                  t.atoms.bg_contrast_25,
                ]}>
                <Link
                  label={_(msg`Search for all posts with tag ${displayTag}`)}
                  to={makeSearchLink({query: displayTag})}
                  onPress={e => {
                    e.preventDefault()

                    control.close(() => {
                      navigation.push('Hashtag', {
                        tag: tag.replaceAll('#', '%23'),
                      })
                    })

                    return false
                  }}>
                  <View
                    style={[
                      a.w_full,
                      a.flex_row,
                      a.align_center,
                      a.justify_start,
                      a.gap_md,
                      a.px_lg,
                      a.py_md,
                    ]}>
                    <Search size="lg" style={[t.atoms.text_contrast_medium]} />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={[
                        a.flex_1,
                        a.text_md,
                        a.font_bold,
                        native({top: 2}),
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        See{' '}
                        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                          {displayTag}
                        </Text>{' '}
                        posts
                      </Trans>
                    </Text>
                  </View>
                </Link>

                {authorHandle && !isInvalidHandle(authorHandle) && (
                  <>
                    <Divider />

                    <Link
                      label={_(
                        msg`Search for all posts by @${authorHandle} with tag ${displayTag}`,
                      )}
                      to={makeSearchLink({
                        query: displayTag,
                        from: authorHandle,
                      })}
                      onPress={e => {
                        e.preventDefault()

                        control.close(() => {
                          navigation.push('Hashtag', {
                            tag: tag.replaceAll('#', '%23'),
                            author: authorHandle,
                          })
                        })

                        return false
                      }}>
                      <View
                        style={[
                          a.w_full,
                          a.flex_row,
                          a.align_center,
                          a.justify_start,
                          a.gap_md,
                          a.px_lg,
                          a.py_md,
                        ]}>
                        <Person
                          size="lg"
                          style={[t.atoms.text_contrast_medium]}
                        />
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="middle"
                          style={[
                            a.flex_1,
                            a.text_md,
                            a.font_bold,
                            native({top: 2}),
                            t.atoms.text_contrast_medium,
                          ]}>
                          <Trans>
                            See{' '}
                            <Text
                              style={[a.text_md, a.font_bold, t.atoms.text]}>
                              {displayTag}
                            </Text>{' '}
                            posts by this user
                          </Trans>
                        </Text>
                      </View>
                    </Link>
                  </>
                )}

                {preferences ? (
                  <>
                    <Divider />

                    <Button
                      label={
                        isMuted
                          ? _(msg`Unmute all ${displayTag} posts`)
                          : _(msg`Mute all ${displayTag} posts`)
                      }
                      onPress={() => {
                        control.close(() => {
                          if (isMuted) {
                            resetUpsert()
                            removeMutedWord({
                              value: tag,
                              targets: ['tag'],
                            })
                          } else {
                            resetRemove()
                            upsertMutedWord([{value: tag, targets: ['tag']}])
                          }
                        })
                      }}>
                      <View
                        style={[
                          a.w_full,
                          a.flex_row,
                          a.align_center,
                          a.justify_start,
                          a.gap_md,
                          a.px_lg,
                          a.py_md,
                        ]}>
                        <Mute
                          size="lg"
                          style={[t.atoms.text_contrast_medium]}
                        />
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="middle"
                          style={[
                            a.flex_1,
                            a.text_md,
                            a.font_bold,
                            native({top: 2}),
                            t.atoms.text_contrast_medium,
                          ]}>
                          {isMuted ? _(msg`Unmute`) : _(msg`Mute`)}{' '}
                          <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                            {displayTag}
                          </Text>{' '}
                          <Trans>posts</Trans>
                        </Text>
                      </View>
                    </Button>
                  </>
                ) : null}
              </View>

              <Button
                label={_(msg`Close this dialog`)}
                size="small"
                variant="ghost"
                color="secondary"
                onPress={() => control.close()}>
                <ButtonText>Cancel</ButtonText>
              </Button>
            </>
          )}
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
