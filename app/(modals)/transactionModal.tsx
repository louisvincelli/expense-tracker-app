import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import ScreenWrapper from '@/components/ScreenWrapper';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageService';
import * as Icons from "phosphor-react-native";
import Typo from '@/components/Typo';
import { TransactionType, UserDataType, WalletType } from '@/types';
import Input from '@/components/Inputs';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/authContext';
import { updateUser } from '@/services/userService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload';
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService';
import { Dropdown } from "react-native-element-dropdown";
import { expenseCategories, transactionTypes } from '@/constants/data';
import useFetchData from '@/hooks/useFetchData';
import { orderBy, where } from 'firebase/firestore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createOrUpdateTransaction, deleteTransaction } from '@/services/transactionService';

const TransactionModal = () => {

    const { user } = useAuth();
    const [transaction, setTransaction] = useState<TransactionType>({
        type: 'expense',
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        walletId: "",
        image: null,
    });
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const router = useRouter();

    const { data: wallets, error: walletError, loading: walletLoading} = useFetchData<WalletType>("wallets", [
        where("uid", "==", user?.uid),
        orderBy("created", "desc"),
      ]);

      type ParamType = {
        id: string;
        type: string;
        amount: string;
        category?: string;
        date: string;
        description?: string;
        image?: any;
        uid?: string;
        walletId: string;
      };

    const oldTransaction: ParamType 
    //{ name: string; image: string; id: string } 
    =
        useLocalSearchParams();

        const onDateChange = (event: any, selectedDate: any) => {
            const currentDate = selectedDate || transaction.date;
            setTransaction({...transaction, date: currentDate});
            setShowDatePicker(Platform.OS == 'ios' ? true : false);
            // const {
            //     type,
            //     nativeEvent: {timestamp, utcOffset},
            // } = event;
        };
    //console.log("old wallet: ", oldWallet);

    useEffect(() => {
        if(oldTransaction?.id) {
            setTransaction({
                type: oldTransaction?.type,
                amount: Number(oldTransaction.amount),
                description: oldTransaction.description || "",
                category: oldTransaction.category || "",
                date: new Date(oldTransaction.date),
                walletId: oldTransaction.walletId,
                //name: oldTransaction?.name,
                image: oldTransaction?.image,
            });
        }
    }, []);

    const onSubmit = async () => {
        const {type, amount, description, category, date, walletId, image } = transaction;

        if(!walletId || !date || !amount || (type == 'expense' && !category)){
            Alert.alert("Transaction", "Please fill all the fields");
            return;
        }

        //console.log('good to go');
        let transactionData: TransactionType = {
            type,
            amount,
            description,
            category,
            date,
            walletId,
            image: image ? image : null,
            uid: user?.uid, 
        };

        //console.log('Transaction data: ', transactionData);
        if(oldTransaction?.id) transactionData.id = oldTransaction.id;
        //include transaction id for updating^^
        setLoading(true);
        const res = await createOrUpdateTransaction(transactionData);

        setLoading(false);
        if(res.success){
            router.back();
        }else{
            Alert.alert("Transaction", res.msg);
        }
    };

    const onDelete = async () => {
        //console.log("Deleting Wallet: ", oldWallet?.id);
        if(!oldTransaction?.id) return;
        setLoading(true);
        const res = await deleteTransaction(
            oldTransaction?.id, 
            oldTransaction.walletId
        );
        setLoading(false);
        if(res.success){
            router.back();
        } else {
            Alert.alert("Transaction", res.msg);
        }
    }

    const showDeleteAlert = () => {
        Alert.alert(
            "Confirm", "Are you sure you want to delete this transaction?",
            [
                {
                    text: "Cancel",
                    onPress: ()=> console.log("cancel delete"),
                    style: 'cancel'
                },
                {
                    text: "Delete",
                    onPress: ()=> onDelete(),
                    style: 'destructive'
                }
            ]
        );
    };

    // const data = [
    //     { label: 'Item 1', value: '1' },
    //     { label: 'Item 2', value: '2' },
    //     { label: 'Item 3', value: '3' },
    //     { label: 'Item 4', value: '4' },
    //     { label: 'Item 5', value: '5' },
    //     { label: 'Item 6', value: '6' },
    //     { label: 'Item 7', value: '7' },
    //     { label: 'Item 8', value: '8' },
    // ];

    // const renderLabel = () => {
    //     if (value || isFocus) {
    //         return (
    //             <Text style={[styles.label, isFocus && { color: 'blue' }]}>
    //                 Dropdown Label
    //             </Text>
    //         );
    //     }
    //     return null;
    // };

    // const [value, setValue] = useState(null);
    // const [isFocus, setFocus] = useState(false);

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
            title={oldTransaction?.id ? "Update Transaction": "New Transaction"}
            leftIcon={<BackButton />}
            style={{ marginBottom: spacingY._10 }}
        />

        {/* form */}
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* transaction types */}
            <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={16}>Type</Typo>
                {/* dropdown */}
                <Dropdown 
                    style={styles.dropdownContainer}
                    activeColor={colors.neutral700}  
                    //placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    //inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.dropdownIcon}
                    data={transactionTypes}
                    //search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    itemTextStyle={styles.dropdownItemText}
                    itemContainerStyle={styles.dropdownItemContainer}
                    containerStyle={styles.dropdownListContainer}
                    //placeholder={!isFocus ? 'Select item' : '...'}
                    //searchPlaceholder='Search...'
                    value={transaction.type}
                    //onFocus={()=> setIsFocus(true)}
                    //onBlur={()=> setIsFocus(true)}
                    onChange={item => {
                        setTransaction({...transaction, type: item.value });
                        // setValue(item.value);
                        // setIsFocus(true);
                    }}
                    // renderLeftIcon={() => (
                    //     <AntDesign
                    //         style={styles.icon}
                    //         color={isFocus ? "blue": "black"}
                    //         name="Safety"
                    //         size={20}
                    //     />
                    // )}
                />   
            </View>
                    {/* wallet input */}
            <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={16}>Wallet</Typo>
                {/* dropdown */}
                <Dropdown 
                    style={styles.dropdownContainer}
                    activeColor={colors.neutral700}  
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    iconStyle={styles.dropdownIcon}
                    data={wallets.map((wallet) => ({
                        label: `${wallet?.name} ($${wallet.amount})`,
                        value: wallet?.id,
                    }))}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    itemTextStyle={styles.dropdownItemText}
                    itemContainerStyle={styles.dropdownItemContainer}
                    containerStyle={styles.dropdownListContainer}
                    placeholder={'Select wallet'}
                    value={transaction.walletId}
                    onChange={item => {
                        setTransaction({...transaction, walletId: item.value || "" });
                    }}
                />   
            </View>
                    {/* expense categories */}

                    {
                        transaction.type == "expense" && (
                            <View style={styles.inputContainer}>
                                <Typo color={colors.neutral200} size={16}>Expense Category</Typo>
                                    {/* dropdown */}
                                <Dropdown 
                                    style={styles.dropdownContainer}
                                    activeColor={colors.neutral700}  
                                    placeholderStyle={styles.dropdownPlaceholder}
                                    selectedTextStyle={styles.dropdownSelectedText}
                                    iconStyle={styles.dropdownIcon}
                                    data={Object.values(expenseCategories)}
                                    maxHeight={300}
                                    labelField="label"
                                    valueField="value"
                                    itemTextStyle={styles.dropdownItemText}
                                    itemContainerStyle={styles.dropdownItemContainer}
                                    containerStyle={styles.dropdownListContainer}
                                    placeholder={'Select category'}
                                    value={transaction.category}
                                    onChange={item => {
                                        setTransaction({...transaction, category: item.value || "" });
                                    }}
                                />   
                            </View>
                        )
                    }
                
                {/* date picker */}
            <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={16}>Date</Typo>
                {
                    !showDatePicker && (
                        <Pressable
                            style={styles.dateInput}
                            onPress={()=> setShowDatePicker(true)}
                        >
                            <Typo size={14}>
                                {(transaction.date as Date).toLocaleDateString()}
                            </Typo>
                        </Pressable>
                    )
                }

                {
                    showDatePicker && (
                        <View style={Platform.OS == 'ios' && styles.iosDatePicker}>
                            <DateTimePicker
                                themeVariant='dark'
                                value={transaction.date as Date}
                                textColor={colors.white}
                                mode='date'
                                display={Platform.OS == 'ios' ? "spinner" : "default"}
                                onChange={onDateChange}
                            />

                            {
                                Platform.OS == 'ios' && (
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Typo size={15} fontWeight={"500"}>
                                        Ok
                                    </Typo>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }
            </View>

            {/* amount */}
            <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={16}>Amount</Typo>
                <Input 
                    //placeholder='Salary'
                    keyboardType='numeric'
                    value={transaction.amount?.toString()}
                    onChangeText={(value) => 
                        setTransaction({...transaction, amount: Number(value.replace(/[^0-9]/g, ""))})
                    }
                />       
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.flexRow}>
                    <Typo color={colors.neutral200} size={16}>Description</Typo>
                    <Typo color={colors.neutral500} size={14}>(optional)</Typo>
                </View>
            
                <Input 
                    //placeholder='Salary'
                    value={transaction.description}
                    multiline
                    containerStyle={{
                        flexDirection: 'row',
                        height: verticalScale(100),
                        alignItems: 'flex-start',
                        paddingVertical: 15,
                    }}
                    onChangeText={(value) => 
                        setTransaction({...transaction, description: value})
                    }
                />       
            </View>

            <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
                    <Typo color={colors.neutral200} size={16}>Receipt</Typo>
                    <Typo color={colors.neutral500} size={14}>(optional)</Typo>
                </View>
                {/* image input */}
                <ImageUpload 
                    file={transaction.image}
                    onClear={()=> setTransaction({...transaction, image: null})} 
                    onSelect={file=> setTransaction({...transaction, image: file})} 
                    placeholder='Upload Image'
                />  
            </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
            <Button
                onPress={showDeleteAlert}
                style={{
                    backgroundColor: colors.rose,
                    paddingHorizontal: spacingX._15,
                }}
            >
                <Icons.Trash
                    color={colors.white}
                    size={verticalScale(24)}
                    weight='bold'
                />
            </Button>
        )}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
            <Typo color={colors.black} fontWeight={"700"}>
                {
                    oldTransaction?.id ? "Update": "Submit"
                }
            </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};
export default TransactionModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //justifyContent: "space-between",
        paddingHorizontal: spacingY._20,
        // paddingVertical: spacingY._30,
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1,
    },
    form: {
        gap: spacingY._20,
        paddingVertical: spacingY._15,
        paddingBottom: spacingY._40,
        //marginTop: spacingY._15,
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center",
    },
    avatar: {
        alignSelf: "center",
        backgroundColor: colors.neutral300,
        height: verticalScale(135),
        width: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        borderColor: colors.neutral500,
        // overflow: "hidden",
        // position: "relative",
    },
    inputContainer: {
        gap: spacingY._10,
    },
    iosDropDown: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        fontSize: verticalScale(14),
        borderWidth: 1,
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    androidDropDown: {
        // flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        fontSize: verticalScale(14),
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        // paddingHorizontal: spacingX._15,
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._15,
    },
    dateInput: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    iosDatePicker: {
        //backgroundColor: "red",
    },
    datePickerButton: {
        backgroundColor: colors.neutral700,
        alignSelf: "flex-end",
        padding: spacingY._7,
        marginRight: spacingX._7,
        paddingHorizontal: spacingY._15,
        borderRadius: radius._10,
    },
    dropdownContainer: {
        height: verticalScale(54),
        borderWidth: 1,
        borderColor: colors.neutral300,
        paddingHorizontal: spacingX._15,
        borderRadius: radius._15,
        borderCurve: "continuous",
    },
    dropdownItemText: {
        color: colors.white,
    },
    dropdownSelectedText: {
        color: colors.white,
        fontSize: verticalScale(14),
    },
    dropdownListContainer: {
        backgroundColor: colors.neutral900,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingVertical: spacingY._7,
        top: 5,
        borderColor: colors.neutral500,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
    },
    dropdownPlaceholder: {
        color: colors.white,
    },
    dropdownItemContainer: {
        borderRadius: radius._15,
        marginHorizontal: spacingX._7,
    },
    dropdownIcon: {
        height: verticalScale(30),
        tintColor: colors.neutral300,
    },
});